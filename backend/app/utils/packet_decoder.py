import struct
from typing import Dict, Any, Optional
from datetime import datetime
from app.schemas.telemetry import TelemetryCreate

# Format String for Python struct:
# <  : Little-Endian
# B  : uint8_t  (preamble = 0xAA)
# 8s : char[8]   (node_id)
# I  : uint32_t (seq_num)
# H  : uint16_t (soil_moisture_raw)
# B  : uint8_t  (soil_moisture_pct)
# B  : uint8_t  (rain_intensity_pct)
# h  : int16_t  (tilt_angle_x100)
# h  : int16_t  (tilt_rate_x1000)
# h  : int16_t  (accel_x_mg)
# h  : int16_t  (accel_y_mg)
# h  : int16_t  (accel_z_mg)
# H  : uint16_t (battery_mv)
# B  : uint8_t  (status_flags)
# H  : uint16_t (crc16)
LORA_PACKET_FMT = "<B8sIHBBhhhhhHBH"
LORA_PACKET_SIZE = struct.calcsize(LORA_PACKET_FMT)  # 32 Bytes


def compute_crc16(data: bytes) -> int:
    """Computes CRC-16 (IBM / Modbus polynomial 0xA001) matching ESP32 firmware."""
    crc = 0xFFFF
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 0x0001:
                crc = (crc >> 1) ^ 0xA001
            else:
                crc >>= 1
    return crc


def decode_lora_binary_packet(
    raw_bytes: bytes,
    rssi_dbm: int = -70,
    snr_db: float = 9.0,
    verify_crc: bool = True,
) -> Optional[TelemetryCreate]:
    """
    Decodes a 32-byte raw binary LoRa packet into a Pydantic TelemetryCreate schema.
    """
    if len(raw_bytes) != LORA_PACKET_SIZE:
        raise ValueError(f"Invalid packet length {len(raw_bytes)} bytes (expected {LORA_PACKET_SIZE})")

    # Unpack fields
    unpacked = struct.unpack(LORA_PACKET_FMT, raw_bytes)
    (
        preamble,
        node_id_raw,
        seq_num,
        soil_raw,
        soil_pct,
        rain_pct,
        tilt_x100,
        rate_x1000,
        ax_mg,
        ay_mg,
        az_mg,
        batt_mv,
        flags,
        received_crc,
    ) = unpacked

    if preamble != 0xAA:
        raise ValueError(f"Invalid magic header 0x{preamble:02X} (expected 0xAA)")

    # CRC Validation
    if verify_crc:
        payload_to_verify = raw_bytes[:-2]
        expected_crc = compute_crc16(payload_to_verify)
        if received_crc != expected_crc:
            raise ValueError(f"CRC Mismatch: received 0x{received_crc:04X}, calculated 0x{expected_crc:04X}")

    node_id = node_id_raw.decode("utf-8", errors="ignore").rstrip("\x00")

    # Status flag unpacking
    rain_detected = bool(flags & (1 << 0))
    # imu_online = bool(flags & (1 << 1))
    # rapid_creep = bool(flags & (1 << 2))

    # Convert engineering units
    tilt_angle = tilt_x100 / 100.0
    tilt_rate = rate_x1000 / 1000.0
    accel_x = ax_mg / 1000.0
    accel_y = ay_mg / 1000.0
    accel_z = az_mg / 1000.0

    battery_pct = max(0.0, min(100.0, ((batt_mv / 1000.0 - 3.3) / (4.2 - 3.3)) * 100.0))

    return TelemetryCreate(
        node_id=node_id,
        timestamp=datetime.utcnow(),
        soil_moisture=float(soil_pct),
        soil_moisture_raw=int(soil_raw),
        rainfall=float(rain_pct),
        rainfall_24h=float(rain_pct * 0.8),  # initial fallback if gateway accumulator not present
        rain_detected=rain_detected,
        tilt_angle=round(tilt_angle, 2),
        tilt_rate=round(tilt_rate, 4),
        accel_x=round(accel_x, 3),
        accel_y=round(accel_y, 3),
        accel_z=round(accel_z, 3),
        battery=round(battery_pct, 1),
        battery_mv=int(batt_mv),
        rssi=int(rssi_dbm),
        snr=float(snr_db),
        seq_num=int(seq_num),
    )


def encode_lora_binary_packet(
    node_id: str,
    seq_num: int,
    soil_moisture_raw: int,
    soil_moisture_pct: float,
    rain_intensity_pct: float,
    tilt_angle_deg: float,
    tilt_rate_deg_min: float,
    accel_x_g: float,
    accel_y_g: float,
    accel_z_g: float,
    battery_mv: int,
    rain_detected: bool = False,
    imu_online: bool = True,
    rapid_creep: bool = False,
) -> bytes:
    """Encodes sensor data into the exact 32-byte binary LoRa packet struct."""
    preamble = 0xAA
    node_id_bytes = node_id.encode("utf-8")[:8].ljust(8, b"\x00")
    
    flags = 0
    if rain_detected: flags |= (1 << 0)
    if imu_online: flags |= (1 << 1)
    if rapid_creep: flags |= (1 << 2)

    payload_without_crc = struct.pack(
        "<B8sIHBBhhhhhHB",
        preamble,
        node_id_bytes,
        int(seq_num),
        int(soil_moisture_raw),
        int(round(soil_moisture_pct)),
        int(round(rain_intensity_pct)),
        int(round(tilt_angle_deg * 100.0)),
        int(round(tilt_rate_deg_min * 1000.0)),
        int(round(accel_x_g * 1000.0)),
        int(round(accel_y_g * 1000.0)),
        int(round(accel_z_g * 1000.0)),
        int(battery_mv),
        int(flags),
    )

    crc16 = compute_crc16(payload_without_crc)
    return payload_without_crc + struct.pack("<H", crc16)
