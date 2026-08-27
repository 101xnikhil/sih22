#!/usr/bin/env python3
"""
LANDGUARD AI — USB Serial-to-HTTP Gateway Forwarder Bridge
Useful for field testing and demonstrations when Wi-Fi is unavailable.
Reads incoming telemetry directly from an ESP32 plugged in via USB Serial
and forwards it via HTTP POST to the local FastAPI backend (http://127.0.0.1:8001/api/telemetry).
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

BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8001/api/telemetry")
DEFAULT_BAUD = 115200

def list_available_ports():
    if not serial:
        print("[WARN] pyserial not installed. Run: pip install pyserial")
        return []
    ports = list(serial.tools.list_ports.comports())
    return [p.device for p in ports]

def run_serial_bridge(port: str = None, baud: int = DEFAULT_BAUD):
    if not serial:
        print("[ERROR] pyserial is required. Install with: pip install pyserial")
        return

    if not port:
        ports = list_available_ports()
        if not ports:
            print("[INFO] No USB serial ports detected. Plug in your ESP32 board.")
            return
        port = ports[0]
        print(f"[INFO] Auto-detected USB port: {port}")

    print(f"[BRIDGE] Opening serial port {port} @ {baud} baud...")
    print(f"[BRIDGE] Forwarding incoming packets to: {BACKEND_URL}")

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
                        "soil_moisture": payload.get("soil_moisture", payload.get("sensors", {}).get("soil_moisture_pct", 50.0)),
                        "soil_moisture_raw": payload.get("soil_moisture_raw", payload.get("sensors", {}).get("soil_moisture_raw", 2000)),
                        "rainfall": payload.get("rainfall", payload.get("sensors", {}).get("rainfall_pct", 0.0)),
                        "rainfall_24h": payload.get("rainfall_24h", 0.0),
                        "rain_detected": payload.get("rain_detected", payload.get("sensors", {}).get("rain_detected", False)),
                        "tilt_angle": payload.get("tilt_angle", payload.get("sensors", {}).get("tilt_angle_deg", 22.0)),
                        "tilt_rate": payload.get("tilt_rate", payload.get("sensors", {}).get("tilt_rate_deg_min", 0.0)),
                        "accel_x": payload.get("accel_x", payload.get("accel", {}).get("x", 0.0)),
                        "accel_y": payload.get("accel_y", payload.get("accel", {}).get("y", 0.0)),
                        "accel_z": payload.get("accel_z", payload.get("accel", {}).get("z", 1.0)),
                        "battery": payload.get("battery", payload.get("battery", {}).get("level_pct", 85.0)),
                        "battery_mv": payload.get("battery_mv", payload.get("battery", {}).get("voltage_mv", 3800)),
                        "rssi": payload.get("rssi", -60),
                        "snr": payload.get("snr", 9.5),
                    }

                    res = requests.post(BACKEND_URL, json=req_payload, timeout=2.0)
                    if res.status_code == 201:
                        data = res.json()
                        risk = data.get("risk", {})
                        print(f" [HTTP 201] -> Uploaded! Risk: {risk.get('risk_level')} ({risk.get('risk_score', 0)*100:.1f}%), FoS: {risk.get('factor_of_safety', 0):.2f}\n")
                    else:
                        print(f" [HTTP {res.status_code}] Failed: {res.text}\n")

                except json.JSONDecodeError:
                    pass
                except Exception as ex:
                    print(f" [HTTP ERR] {ex}\n")
            else:
                # Print debug diagnostic logs from firmware
                print(f"[ESP32 LOG] {line}")

    except KeyboardInterrupt:
        print("\n[BRIDGE] Stopped by user.")
    except Exception as e:
        print(f"[ERROR] Serial communication failed: {e}")

if __name__ == "__main__":
    port_arg = sys.argv[1] if len(sys.argv) > 1 else None
    run_serial_bridge(port_arg)
