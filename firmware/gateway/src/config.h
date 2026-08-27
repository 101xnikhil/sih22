#ifndef LANDGUARD_GATEWAY_CONFIG_H
#define LANDGUARD_GATEWAY_CONFIG_H

#include <Arduino.h>

// ============================================================================
// LANDGUARD AI — ESP32 LoRa Gateway Hardware & Network Configuration
// ============================================================================

// --- Gateway Identification ---
#define GATEWAY_ID                  "LG-GW01"
#define GATEWAY_FW_VERSION          "v0.2.0-gateway"

// --- Wi-Fi & Backend Endpoint Configuration ---
// Update these values to match your local network and laptop FastAPI backend IP
#ifndef WIFI_SSID
#define WIFI_SSID                   "LANDGUARD_FIELD_NET"
#endif

#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD               "landguard2026"
#endif

// Default FastAPI backend ingestion endpoint (change to your laptop local IP)
#ifndef BACKEND_URL
#define BACKEND_URL                 "http://192.168.1.100:8001/api/telemetry"
#endif

// --- GPIO Pinout Mapping for LoRa SX1278 (SPI Bus) ---
#define PIN_LORA_SCK                18      // VSPI SCK
#define PIN_LORA_MISO               19      // VSPI MISO
#define PIN_LORA_MOSI               23      // VSPI MOSI
#define PIN_LORA_SS                 5       // Chip Select (NSS)
#define PIN_LORA_RST                16      // Radio Reset (NRESET)
#define PIN_LORA_DIO0               4       // Packet RX Done Interrupt
#define PIN_STATUS_LED              2       // Onboard Blue Status LED

// --- LoRa Radio Modulation Parameters (Must match Sensor Node) ---
#define LORA_FREQUENCY_HZ           433E6   // 433.0 MHz ISM Band
#define LORA_SYNC_WORD              0xF3    // LANDGUARD Private Network Sync Word
#define LORA_SPREADING_FACTOR       7       // SF7 (Fast, low airtime)
#define LORA_SIGNAL_BANDWIDTH       125E3   // 125 kHz
#define LORA_CODING_RATE_4          5       // 4/5 forward error correction
#define LORA_TX_POWER_DBM           17      // +17 dBm for ACK transmission

// --- Protocol & Buffering Constraints ---
#define MAX_OFFLINE_BUFFER_SIZE     64      // Maximum packets buffered in RAM during Wi-Fi outage
#define HTTP_TIMEOUT_MS             3000    // HTTP POST timeout in ms
#define WIFI_RECONNECT_INTERVAL_MS  5000    // Non-blocking Wi-Fi reconnect retry period
#define BUFFER_FLUSH_INTERVAL_MS    1000    // Flush rate for offline buffer once online

#endif // LANDGUARD_GATEWAY_CONFIG_H
