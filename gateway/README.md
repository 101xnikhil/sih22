# LANDGUARD AI — ESP32 LoRa Gateway (`LG-GW01`)

This directory contains the firmware for the **second ESP32**, acting as the **LoRa-to-Wi-Fi Edge Gateway** for the LANDGUARD AI early warning system.

---

## 📡 Gateway Architecture

```
┌─────────────────────────┐          433 MHz LoRa RF          ┌─────────────────────────┐
│   ESP32 Sensor Node     │ ─────────────────────────────────►│   ESP32 LoRa Gateway    │
│       (LG-N01)          │ ◄─────────────────────────────────│       (LG-GW01)         │
└─────────────────────────┘          Stop-and-Wait ACK        └────────────┬────────────┘
                                                                           │
                                                                  Wi-Fi / Local Network
                                                                           │
                                                                           ▼
                                                              ┌─────────────────────────┐
                                                              │   FastAPI Local Backend │
                                                              │   POST /api/telemetry   │
                                                              └────────────┬────────────┘
                                                                           │
                                                                           ▼
                                                              ┌─────────────────────────┐
                                                              │ Mission Control Center  │
                                                              │  (React + WebSocket)    │
                                                              └─────────────────────────┘
```

---

## 📌 Gateway Pinout Table (SX1278 SPI Bus)

| Gateway ESP32 Pin | SX1278 LoRa Pin | Description |
|---|---|---|
| `3V3` | `VCC` | 3.3V Power Rail *(Connect 100µF decoupling capacitor across VCC/GND)* |
| `GND` | `GND` | Common Ground |
| `GPIO18` | `SCK` | SPI Clock |
| `GPIO19` | `MISO` | Master In / Slave Out |
| `GPIO23` | `MOSI` | Master Out / Slave In |
| `GPIO5` | `NSS (CS)` | Active LOW Slave Select |
| `GPIO16` | `RST` | Radio Hardware Reset |
| `GPIO4` | `DIO0` | Packet RX Done Interrupt |
| `GPIO2` | `LED` | Onboard Blue Status LED (Blinks on packet RX & ACK TX) |

---

## ⚙️ Configuration (`src/config.h`)

Update the network and endpoint parameters in `src/config.h` before flashing:

```cpp
#define WIFI_SSID           "Your_WiFi_Name"
#define WIFI_PASSWORD       "Your_WiFi_Password"
#define BACKEND_URL         "http://192.168.1.100:8001/api/telemetry"
```

---

## 🔄 Gateway Operating Logic

1. **LoRa Packet Ingest:** Listens on 433.0 MHz (Sync Word `0xF3`, SF7, BW 125kHz).
2. **CRC & Integrity Check:** Validates the CCITT-16 checksum and `0xAA` preamble.
3. **Instant ACK Dispatch:** Transmits `ACK:<node_id>:<seq_num>` back to the sensor node within 50ms.
4. **Duplicate Detection:** Rejects duplicate sequence numbers while still responding with an ACK.
5. **Wi-Fi Bridge & Offline Buffering:**
   - If Wi-Fi is connected: Immediately executes HTTP POST to `BACKEND_URL`.
   - If Wi-Fi is down: Pushes the JSON payload into an in-memory **FIFO Ring Buffer (up to 64 packets)**.
   - When Wi-Fi recovers: Automatically flushes and uploads backlogged packets in chronological order.

---

## 📋 Serial Console Output Walkthrough

```text
=================================================================
      LoRa-TO-WIFI EDGE IOT GATEWAY FOR LANDGUARD AI             
=================================================================
 Gateway ID:       LG-GW01
 Firmware Version: v0.2.0-gateway
 Target Backend:   http://192.168.1.100:8001/api/telemetry
 LoRa RF Channel:  433.0 MHz (SX1278)
=================================================================

[LoRa] Gateway Receiver listening @ 433.0 MHz (SF7, Sync 0xF3)
[WiFi] Connected! IP Address: 192.168.1.105 (RSSI: -52 dBm)
[HTTP] Target Backend: http://192.168.1.100:8001/api/telemetry
[STATUS] Gateway operating in continuous bridge mode...

-----------------------------------------------------------------
[LoRa] Packet received (32 bytes, RSSI: -65 dBm, SNR: 9.5 dB)
[LoRa] Node: LG-N01 | Seq: #1042 | Moisture: 62.4% | Tilt: 26.75° | Rate: +0.0380°/min
[ACK] Sent 'ACK:LG-N01:1042' to LG-N01
[HTTP] Telemetry uploaded to http://192.168.1.100:8001/api/telemetry
[HTTP] Status: 201
```

---

## 🚀 Flashing Instructions

### Using PlatformIO:
```bash
cd firmware/gateway
pio run --target upload --environment esp32gateway
pio device monitor --baud 115200
```

### Using Arduino IDE:
1. Open `src/gateway.ino` in Arduino IDE.
2. Select Board: **ESP32 Dev Module**.
3. Install `LoRa` and `ArduinoJson` via the Library Manager.
4. Click **Upload**.
