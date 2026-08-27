import pytest
from app.utils.packet_decoder import (
    encode_lora_binary_packet,
    decode_lora_binary_packet,
    LORA_PACKET_SIZE,
    compute_crc16,
)


def test_lora_packet_exact_size():
    """Verify that the packet is exactly 32 bytes with no compiler padding."""
    assert LORA_PACKET_SIZE == 32


def test_encode_decode_roundtrip():
    """Verify byte-level encoding and decoding with CRC validation."""
    raw_packet = encode_lora_binary_packet(
        node_id="LG-N01",
        seq_num=1042,
        soil_moisture_raw=1850,
        soil_moisture_pct=62.4,
        rain_intensity_pct=45.0,
        tilt_angle_deg=26.75,
        tilt_rate_deg_min=0.038,
        accel_x_g=0.450,
        accel_y_g=0.020,
        accel_z_g=0.890,
        battery_mv=3840,
        rain_detected=True,
        imu_online=True,
        rapid_creep=False,
    )

    assert len(raw_packet) == 32
    assert raw_packet[0] == 0xAA  # Magic header

    # Decode packet
    telemetry = decode_lora_binary_packet(raw_packet, rssi_dbm=-65, snr_db=9.5)

    assert telemetry.node_id == "LG-N01"
    assert telemetry.seq_num == 1042
    assert telemetry.soil_moisture == 62.0
    assert telemetry.soil_moisture_raw == 1850
    assert telemetry.rainfall == 45.0
    assert telemetry.rain_detected is True
    assert telemetry.tilt_angle == 26.75
    assert telemetry.tilt_rate == 0.038
    assert telemetry.accel_x == 0.450
    assert telemetry.battery_mv == 3840
    assert telemetry.rssi == -65
    assert telemetry.snr == 9.5


def test_crc_tampering_detection():
    """Verify that corrupted packets are rejected by CRC verification."""
    raw_packet = bytearray(encode_lora_binary_packet(
        node_id="LG-N01",
        seq_num=1,
        soil_moisture_raw=2000,
        soil_moisture_pct=50.0,
        rain_intensity_pct=0.0,
        tilt_angle_deg=20.0,
        tilt_rate_deg_min=0.0,
        accel_x_g=0.0,
        accel_y_g=0.0,
        accel_z_g=1.0,
        battery_mv=3800,
    ))

    # Corrupt 1 byte in payload
    raw_packet[10] ^= 0xFF

    with pytest.raises(ValueError, match="CRC Mismatch"):
        decode_lora_binary_packet(bytes(raw_packet))
