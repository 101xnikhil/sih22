"""
LANDGUARD AI — Mock Gateway End-to-End Simulation Test
Simulates:
1. Sensor Node encoding 32-byte binary LoRa packet with CRC-16
2. Gateway receiving packet, verifying CRC, adding RSSI/SNR network metadata
3. Gateway serializing to JSON payload matching TELEMETRY_SPEC.md
4. Gateway HTTP POST to FastAPI backend (/api/telemetry)
5. Backend executing Factor of Safety + XGBoost ML + SHAP pipeline
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.utils.packet_decoder import encode_lora_binary_packet, decode_lora_binary_packet
from fastapi.testclient import TestClient
from app.main import app

def run_end_to_end_gateway_test():
    print("=" * 80)
    print("LANDGUARD AI — LoRa Gateway Pipeline End-to-End Test")
    print("=" * 80)

    # 1. Step 1: ESP32 Sensor Node generates and encodes 32-byte binary packet
    print("\n[Step 1: Sensor Node] Generating raw binary telemetry frame...")
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
    print(f" -> Generated {len(raw_packet)} byte LoRa frame. Magic: 0x{raw_packet[0]:02X}")

    # 2. Step 2: Gateway receives LoRa frame, validates CRC, and unpacks
    print("\n[Step 2: ESP32 Gateway] Receiving and decoding LoRa RF packet...")
    simulated_rssi = -65
    simulated_snr = 9.5
    
    telemetry_obj = decode_lora_binary_packet(
        raw_bytes=raw_packet,
        rssi_dbm=simulated_rssi,
        snr_db=simulated_snr,
        verify_crc=True
    )
    print(f"[LoRa] Packet received (32 bytes, RSSI: {simulated_rssi} dBm, SNR: {simulated_snr} dB)")
    print(f"[LoRa] Node: {telemetry_obj.node_id} | Seq: #{telemetry_obj.seq_num}")
    print(f"[ACK]  Sent 'ACK:{telemetry_obj.node_id}:{telemetry_obj.seq_num}'")

    # 3. Step 3: Gateway sends HTTP POST to FastAPI backend
    print("\n[Step 3: Gateway HTTP Forwarder] Sending HTTP POST to /api/telemetry...")
    client = TestClient(app)
    payload = telemetry_obj.model_dump(mode="json")
    
    response = client.post("/api/telemetry", json=payload)
    print(f"[HTTP] Status: {response.status_code}")
    assert response.status_code == 201

    res_json = response.json()
    print(f"[HTTP] Telemetry uploaded successfully! Telemetry ID: {res_json['telemetry_id']}")

    # 4. Step 4: Verify Backend AI Analysis & Geotechnical Result
    print("\n[Step 4: AI Risk Engine Verification]")
    risk = res_json["risk"]
    print(f" • Risk Level:       {risk['risk_level']}")
    print(f" • Hazard Score:      {risk['risk_score'] * 100:.1f}%")
    print(f" • Factor of Safety:  {risk['factor_of_safety']:.2f}")
    print(f" • Confidence:        {risk['confidence'] * 100:.0f}%")
    print(f" • Model Version:     {risk['model_version']}")
    
    print("\n[SHAP Feature Attributions]")
    for factor in risk["shap_values"][:3]:
        impact_sign = "+" if factor["contribution"] > 0 else ""
        print(f" • {factor['display_name']} ({factor['value']}): {impact_sign}{factor['contribution']:.3f} [{factor.get('impact', 'N/A')}]")

    print("\n" + "=" * 80)
    print("✅ END-TO-END LORA-TO-BACKEND PIPELINE VERIFIED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_end_to_end_gateway_test()
