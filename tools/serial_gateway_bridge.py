#!/usr/bin/env python3
"""
LANDGUARD AI — USB Serial-to-HTTP Gateway & Blynk IoT Bridge
Reads incoming telemetry directly from an ESP32 plugged in via USB Serial
and forwards it via HTTP POST to the local FastAPI backend (http://127.0.0.1:8000/api/telemetry)
and optionally to Blynk IoT Cloud (https://blynk.cloud/external/api/batch/update).
"""

import sys
import os
import time
import json
import requests

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    serial = None

BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000/api/telemetry")
BLYNK_AUTH_TOKEN = os.environ.get("BLYNK_AUTH_TOKEN", "")
DEFAULT_BAUD = 115200


def list_available_ports():
    if not serial:
        print("[WARN] pyserial not installed. Run: pip install pyserial")
        return []
    ports = list(serial.tools.list_ports.comports())
    return [p.device for p in ports]


def forward_to_blynk(token: str, payload: dict, risk: dict = None):
    if not token or token == "YOUR_BLYNK_AUTH_TOKEN":
        return
    try:
        moisture = payload.get("soil_moisture_pct", payload.get("soil_moisture", 0.0))
        rainfall = payload.get("rainfall_24h_mm", payload.get("rainfall", 0.0))
        tilt = payload.get("tilt_angle", 0.0)
        tilt_rate = payload.get("tilt_rate", 0.0)
        fos = risk.get("factor_of_safety", 1.84) if risk else 1.84
        risk_score = int(risk.get("risk_score", 0.14) * 100) if risk else 14
        risk_level = risk.get("risk_level", "LOW") if risk else "LOW"
        siren = 1 if risk_level == "CRITICAL" else 0
        rssi = payload.get("rssi_dbm", payload.get("rssi", -60))

        params = {
            "token": token,
            "V0": f"{moisture:.1f}",
            "V1": f"{rainfall:.1f}",
            "V2": f"{tilt:.2f}",
            "V3": f"{tilt_rate:.3f}",
            "V4": f"{fos:.2f}",
            "V5": str(risk_score),
            "V6": risk_level,
            "V7": str(siren),
            "V8": str(rssi),
        }

        blynk_url = "https://blynk.cloud/external/api/batch/update"
        resp = requests.get(blynk_url, params=params, timeout=2.0)
        if resp.status_code == 200:
            print(f" [BLYNK CLOUD] -> Synced Virtual Pins V0-V8 (Status 200 OK)")
        else:
            print(f" [BLYNK CLOUD] -> Status {resp.status_code}: {resp.text[:60]}")
    except Exception as ex:
        print(f" [BLYNK ERR] {ex}")


def run_serial_bridge(port: str = None, baud: int = DEFAULT_BAUD, blynk_token: str = BLYNK_AUTH_TOKEN):
    if not serial:
        print("[ERROR] pyserial is required. Install with: pip install pyserial")
        return

    if not port:
        ports = list_available_ports()
        if not ports:
            print("[INFO] No USB serial ports detected. Plug in your ESP32 board.")
            print("[INFO] Scanning for ports... (Retrying every 2s)")
            while not ports:
                time.sleep(2.0)
                ports = list_available_ports()
        port = ports[0]
        print(f"[INFO] Auto-detected USB port: {port}")

    print(f"[BRIDGE] Opening serial port {port} @ {baud} baud...")
    print(f"[BRIDGE] Forwarding incoming packets to: {BACKEND_URL}")
    if blynk_token:
        print(f"[BRIDGE] Blynk IoT Cloud Forwarding: ENABLED (Token: {blynk_token[:6]}...)")
    else:
        print(f"[BRIDGE] Blynk IoT Cloud Forwarding: DISABLED (Set BLYNK_AUTH_TOKEN or pass as argument)")

    try:
        ser = serial.Serial(port, baud, timeout=1.0)
        time.sleep(1.0)
        print("[BRIDGE] Connected to ESP32! Listening for serial telemetry lines...\n")

        while True:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            # Look for JSON formatted lines (e.g. {"node_id": "LG-N01", ...})
            if line.startswith("{") and line.endswith("}"):
                try:
                    payload = json.loads(line)
                    print(f"[SERIAL RX] JSON Frame from {payload.get('node_id', 'unknown')}: Seq #{payload.get('seq_num', payload.get('sequence', 0))}")

                    # Normalize flat payload fields
                    req_payload = {
                        "node_id": payload.get("node_id", "LG-N01"),
                        "seq_num": payload.get("seq_num", payload.get("sequence", 1)),
                        "soil_moisture_pct": payload.get("soil_moisture_pct", payload.get("soil_moisture", 50.0)),
                        "soil_moisture_raw": payload.get("soil_moisture_raw", 2000),
                        "rainfall_pct": payload.get("rainfall_pct", payload.get("rainfall", 0.0)),
                        "rainfall_24h_mm": payload.get("rainfall_24h_mm", payload.get("rainfall_24h", 0.0)),
                        "rain_detected": payload.get("rain_detected", False),
                        "tilt_angle": payload.get("tilt_angle", 22.0),
                        "tilt_rate": payload.get("tilt_rate", 0.0),
                        "accel_x": payload.get("accel_x", 0.0),
                        "accel_y": payload.get("accel_y", 0.0),
                        "accel_z": payload.get("accel_z", 1.0),
                        "battery_pct": payload.get("battery_pct", payload.get("battery", 85.0)),
                        "battery_mv": payload.get("battery_mv", 3800),
                        "rssi_dbm": payload.get("rssi_dbm", payload.get("rssi", -60)),
                        "snr_db": payload.get("snr_db", 9.5),
                    }

                    risk_data = {}
                    try:
                        res = requests.post(BACKEND_URL, json=req_payload, timeout=2.0)
                        if res.status_code == 201:
                            data = res.json()
                            risk_data = data.get("risk", {})
                            print(f" [HTTP 201] -> Uploaded to LandGuard AI! Risk: {risk_data.get('risk_level')} ({risk_data.get('risk_score', 0)*100:.1f}%), FoS: {risk_data.get('factor_of_safety', 0):.2f}")
                        else:
                            print(f" [HTTP {res.status_code}] Failed: {res.text}")
                    except Exception as ex:
                        print(f" [BACKEND ERR] {ex}")

                    # Forward to Blynk Cloud if token provided
                    if blynk_token:
                        forward_to_blynk(blynk_token, req_payload, risk_data)

                except json.JSONDecodeError:
                    pass
                except Exception as ex:
                    print(f" [PROCESS ERR] {ex}\n")
            else:
                # Print debug diagnostic logs from firmware
                print(f"[ESP32 LOG] {line}")

    except KeyboardInterrupt:
        print("\n[BRIDGE] Stopped by user.")
    except Exception as e:
        print(f"[ERROR] Serial communication failed: {e}")


if __name__ == "__main__":
    port_arg = sys.argv[1] if len(sys.argv) > 1 else None
    token_arg = sys.argv[2] if len(sys.argv) > 2 else BLYNK_AUTH_TOKEN
    run_serial_bridge(port_arg, blynk_token=token_arg)
