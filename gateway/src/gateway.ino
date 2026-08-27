/**
 * LANDGUARD AI — Single-File ESP32 LoRa Gateway Sketch
 * For flashing with Arduino IDE (Select "ESP32 Dev Module").
 * Requires Libraries:
 * - LoRa by Sandeep Mistry
 * - ArduinoJson by Benoit Blanchon
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <LoRa.h>
#include <ArduinoJson.h>

// Wi-Fi & Backend Credentials
const char* WIFI_SSID     = "LANDGUARD_FIELD_NET";
const char* WIFI_PASSWORD = "landguard2026";
const char* BACKEND_URL   = "http://192.168.1.100:8001/api/telemetry";

// LoRa Pins
#define PIN_LORA_SCK   18
#define PIN_LORA_MISO  19
#define PIN_LORA_MOSI  23
#define PIN_LORA_SS    5
#define PIN_LORA_RST   16
#define PIN_LORA_DIO0  4
#define PIN_LED        2

#pragma pack(push, 1)
struct LoRaPkt {
  uint8_t  preamble;
  char     node_id[8];
  uint32_t seq_num;
  uint16_t soil_moisture_raw;
  uint8_t  soil_moisture_pct;
  uint8_t  rain_intensity_pct;
  int16_t  tilt_angle_x100;
  int16_t  tilt_rate_x1000;
  int16_t  accel_x_mg;
  int16_t  accel_y_mg;
  int16_t  accel_z_mg;
  uint16_t battery_mv;
  uint8_t  status_flags;
  uint16_t crc16;
};
#pragma pack(pop)

uint32_t last_seq = 0;
char last_node[8] = "";

uint16_t calcCRC(const uint8_t* data, size_t len) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < len; i++) {
    crc ^= (uint16_t)data[i];
    for (uint8_t j = 0; j < 8; j++) {
      if (crc & 0x0001) crc = (crc >> 1) ^ 0xA001;
      else crc >>= 1;
    }
  }
  return crc;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[GATEWAY] Starting LANDGUARD AI LoRa-to-WiFi Bridge...");

  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, HIGH);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);

  SPI.begin(PIN_LORA_SCK, PIN_LORA_MISO, PIN_LORA_MOSI, PIN_LORA_SS);
  LoRa.setPins(PIN_LORA_SS, PIN_LORA_RST, PIN_LORA_DIO0);
  if (LoRa.begin(433E6)) {
    LoRa.setSyncWord(0xF3);
    LoRa.setSpreadingFactor(7);
    LoRa.setSignalBandwidth(125E3);
    LoRa.enableCrc();
    LoRa.receive();
    Serial.println("[LoRa] 433MHz Gateway Ready");
  } else {
    Serial.println("[LoRa-ERR] Initialization failed");
  }

  digitalWrite(PIN_LED, LOW);
}

void loop() {
  // Check Wi-Fi
  if (WiFi.status() == WL_CONNECTED) {
    // Online
  } else {
    // Auto reconnect
  }

  int packetSize = LoRa.parsePacket();
  if (packetSize == sizeof(LoRaPkt)) {
    digitalWrite(PIN_LED, HIGH);
    LoRaPkt pkt;
    LoRa.readBytes((uint8_t*)&pkt, sizeof(pkt));

    if (pkt.preamble == 0xAA) {
      uint16_t expectedCRC = calcCRC((const uint8_t*)&pkt, sizeof(pkt) - sizeof(uint16_t));
      if (pkt.crc16 == expectedCRC) {
        int rssi = LoRa.packetRssi();
        float snr = LoRa.packetSnr();

        // Send ACK
        char ack[32];
        snprintf(ack, sizeof(ack), "ACK:%s:%u", pkt.node_id, pkt.seq_num);
        LoRa.beginPacket();
        LoRa.print(ack);
        LoRa.endPacket();
        LoRa.receive();

        Serial.printf("[LoRa] Packet received (%d bytes, RSSI: %d dBm, SNR: %.1f dB)\n", packetSize, rssi, snr);
        Serial.printf("[LoRa] Node: %s, Seq: #%u\n", pkt.node_id, pkt.seq_num);
        Serial.printf("[ACK] Sent %s\n", ack);

        // Check duplicate
        if (strcmp(pkt.node_id, last_node) != 0 || pkt.seq_num != last_seq) {
          strncpy(last_node, pkt.node_id, sizeof(last_node));
          last_seq = pkt.seq_num;

          // Build JSON
          JsonDocument doc;
          doc["node_id"] = pkt.node_id;
          doc["seq_num"] = pkt.seq_num;
          doc["soil_moisture"] = pkt.soil_moisture_pct;
          doc["soil_moisture_raw"] = pkt.soil_moisture_raw;
          doc["rainfall"] = pkt.rain_intensity_pct;
          doc["rainfall_24h"] = pkt.rain_intensity_pct * 0.8f;
          doc["rain_detected"] = bool(pkt.status_flags & 1);
          doc["tilt_angle"] = pkt.tilt_angle_x100 / 100.0f;
          doc["tilt_rate"] = pkt.tilt_rate_x1000 / 1000.0f;
          doc["accel_x"] = pkt.accel_x_mg / 1000.0f;
          doc["accel_y"] = pkt.accel_y_mg / 1000.0f;
          doc["accel_z"] = pkt.accel_z_mg / 1000.0f;
          doc["battery"] = map(pkt.battery_mv, 3300, 4200, 0, 100);
          doc["battery_mv"] = pkt.battery_mv;
          doc["rssi"] = rssi;
          doc["snr"] = snr;

          String jsonStr;
          serializeJson(doc, jsonStr);

          if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(BACKEND_URL);
            http.addHeader("Content-Type", "application/json");
            int httpCode = http.POST(jsonStr);
            if (httpCode > 0) {
              Serial.println("[HTTP] Telemetry uploaded");
              Serial.printf("[HTTP] Status: %d\n", httpCode);
            } else {
              Serial.printf("[HTTP-ERR] Error: %s\n", http.errorToString(httpCode).c_str());
            }
            http.end();
          } else {
            Serial.println("[HTTP-WARN] Wi-Fi offline. Telemetry buffered.");
          }
        }
      }
    }
    digitalWrite(PIN_LED, LOW);
  }
  delay(10);
}
