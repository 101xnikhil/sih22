#include "lora_manager.h"

LoRaManager::LoRaManager() : is_ready(false) {}

bool LoRaManager::begin() {
    SPI.begin(PIN_LORA_SCK, PIN_LORA_MISO, PIN_LORA_MOSI, PIN_LORA_SS);
    LoRa.setPins(PIN_LORA_SS, PIN_LORA_RST, PIN_LORA_DIO0);

    if (!LoRa.begin(LORA_FREQUENCY_HZ)) {
        Serial.println(F("[LORA-ERR] LoRa SX1278 initialization failed! Verify SPI connections."));
        is_ready = false;
        return false;
    }

    // Configure Radio Parameters
    LoRa.setSyncWord(LORA_SYNC_WORD);
    LoRa.setSpreadingFactor(LORA_SPREADING_FACTOR);
    LoRa.setSignalBandwidth(LORA_SIGNAL_BANDWIDTH);
    LoRa.setCodingRate4(LORA_CODING_RATE_4);
    LoRa.setTxPower(LORA_TX_POWER_DBM);
    LoRa.enableCrc();

    is_ready = true;
    Serial.printf("[LORA] Radio initialized @ %.1f MHz (SF%d, BW %.0f kHz, Power +%d dBm)\n",
                  (float)(LORA_FREQUENCY_HZ / 1E6),
                  LORA_SPREADING_FACTOR,
                  (float)(LORA_SIGNAL_BANDWIDTH / 1E3),
                  LORA_TX_POWER_DBM);
    return true;
}

bool LoRaManager::sendTelemetry(const TelemetryReport& report, bool require_ack, uint8_t max_retries) {
    if (!is_ready) return false;

    uint8_t buffer[64];
    size_t payload_len = TelemetryBuilder::serializeBinary(report, buffer, sizeof(buffer));
    if (payload_len == 0) return false;

    for (uint8_t attempt = 1; attempt <= max_retries; attempt++) {
        // Blink LED on transmit
        digitalWrite(PIN_STATUS_LED, HIGH);

        LoRa.beginPacket();
        LoRa.write(buffer, payload_len);
        int tx_res = LoRa.endPacket();

        digitalWrite(PIN_STATUS_LED, LOW);

        if (tx_res == 1) {
            Serial.printf("[LORA-TX] Frame #%u transmitted (%d bytes, attempt %u/%u)\n", 
                          report.sequence, payload_len, attempt, max_retries);
        } else {
            Serial.printf("[LORA-ERR] Transmission error on attempt %u/%u\n", attempt, max_retries);
        }

        if (!require_ack) {
            return (tx_res == 1);
        }

        // Wait for gateway ACK
        Serial.printf("[LORA-RX] Listening for ACK (seq #%u, timeout %ums)...\n", report.sequence, LORA_ACK_TIMEOUT_MS);
        if (waitForAck(report.node_id, report.sequence, LORA_ACK_TIMEOUT_MS)) {
            Serial.printf("[LORA-ACK] ✅ ACK confirmed for Frame #%u from Gateway.\n", report.sequence);
            return true;
        }

        Serial.printf("[LORA-WARN] No ACK received for Frame #%u (attempt %u/%u).\n", 
                      report.sequence, attempt, max_retries);

        // Random backoff before retry to prevent collision
        if (attempt < max_retries) {
            uint32_t backoff = 300 + random(200, 600);
            delay(backoff);
        }
    }

    Serial.printf("[LORA-FAIL] ❌ Packet #%u dropped after %u attempts without ACK.\n", 
                  report.sequence, max_retries);
    return false;
}

bool LoRaManager::waitForAck(const char* target_node_id, uint32_t expected_seq, uint32_t timeout_ms) {
    uint32_t start_ms = millis();

    while (millis() - start_ms < timeout_ms) {
        int packet_size = LoRa.parsePacket();
        if (packet_size > 0) {
            String ack_msg = "";
            while (LoRa.available()) {
                ack_msg += (char)LoRa.read();
            }

            // Expected ACK format: "ACK:LG-N01:1042" or binary ACK
            String expected_prefix = String("ACK:") + target_node_id + ":" + String(expected_seq);
            if (ack_msg.indexOf(expected_prefix) >= 0 || ack_msg.indexOf("ACK") >= 0) {
                int rssi = LoRa.packetRssi();
                float snr = LoRa.packetSnr();
                Serial.printf("[LORA-RX] ACK payload: '%s' (RSSI: %d dBm, SNR: %.1f dB)\n", 
                              ack_msg.c_str(), rssi, snr);
                return true;
            }
        }
        delay(10);
    }
    return false;
}

bool LoRaManager::sendJsonTelemetry(const TelemetryReport& report) {
    if (!is_ready) return false;

    String json = TelemetryBuilder::serializeJson(report);

    digitalWrite(PIN_STATUS_LED, HIGH);
    LoRa.beginPacket();
    LoRa.print(json);
    int res = LoRa.endPacket();
    digitalWrite(PIN_STATUS_LED, LOW);

    if (res == 1) {
        Serial.printf("[LORA-TX-JSON] #%u: %s\n", report.sequence, json.c_str());
        return true;
    }
    return false;
}
