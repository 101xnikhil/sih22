#include "lora_rx.h"

LoRaReceiver::LoRaReceiver() : is_ready(false), last_seen_sequence(0) {
    memset(last_seen_node, 0, sizeof(last_seen_node));
}

uint16_t LoRaReceiver::computeCRC16(const uint8_t* data, size_t length) {
    uint16_t crc = 0xFFFF;
    for (size_t i = 0; i < length; i++) {
        crc ^= (uint16_t)data[i];
        for (uint8_t j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    return crc;
}

bool LoRaReceiver::begin() {
    SPI.begin(PIN_LORA_SCK, PIN_LORA_MISO, PIN_LORA_MOSI, PIN_LORA_SS);
    LoRa.setPins(PIN_LORA_SS, PIN_LORA_RST, PIN_LORA_DIO0);

    if (!LoRa.begin(LORA_FREQUENCY_HZ)) {
        Serial.println(F("[LoRa-ERR] Gateway SX1278 initialization failed! Check SPI bus connections."));
        is_ready = false;
        return false;
    }

    // Configure Radio Parameters matching Sensor Node
    LoRa.setSyncWord(LORA_SYNC_WORD);
    LoRa.setSpreadingFactor(LORA_SPREADING_FACTOR);
    LoRa.setSignalBandwidth(LORA_SIGNAL_BANDWIDTH);
    LoRa.setCodingRate4(LORA_CODING_RATE_4);
    LoRa.setTxPower(LORA_TX_POWER_DBM);
    LoRa.enableCrc();

    // Put into continuous receive mode
    LoRa.receive();

    is_ready = true;
    Serial.printf("[LoRa] Gateway Receiver listening @ %.1f MHz (SF%d, Sync 0x%02X)\n",
                  (float)(LORA_FREQUENCY_HZ / 1E6), LORA_SPREADING_FACTOR, LORA_SYNC_WORD);
    return true;
}

bool LoRaReceiver::receivePacket(DecodedPacket& out) {
    if (!is_ready) return false;

    int packet_size = LoRa.parsePacket();
    if (packet_size == 0) return false;

    // Blink status LED on RF packet receive
    digitalWrite(PIN_STATUS_LED, HIGH);

    out.rssi_dbm = LoRa.packetRssi();
    out.snr_db = LoRa.packetSnr();
    out.is_valid = false;
    out.is_duplicate = false;

    // Check if binary struct (32 bytes)
    if (packet_size == sizeof(RawLoRaPacket)) {
        RawLoRaPacket raw;
        LoRa.readBytes((uint8_t*)&raw, sizeof(raw));

        // 1. Verify Magic Header
        if (raw.preamble != 0xAA) {
            Serial.printf("[LoRa-WARN] Invalid preamble 0x%02X (expected 0xAA)\n", raw.preamble);
            digitalWrite(PIN_STATUS_LED, LOW);
            return false;
        }

        // 2. Validate CCITT-16 CRC
        uint16_t expected_crc = computeCRC16((const uint8_t*)&raw, sizeof(raw) - sizeof(uint16_t));
        if (raw.crc16 != expected_crc) {
            Serial.printf("[LoRa-ERR] CRC Error: received 0x%04X, calculated 0x%04X (Corrupted packet dropped)\n", 
                          raw.crc16, expected_crc);
            digitalWrite(PIN_STATUS_LED, LOW);
            return false;
        }

        // 3. Extract Fields
        strncpy(out.node_id, raw.node_id, sizeof(out.node_id) - 1);
        out.node_id[sizeof(out.node_id) - 1] = '\0';
        out.sequence = raw.seq_num;

        // 4. Duplicate Packet Check
        if (strcmp(out.node_id, last_seen_node) == 0 && out.sequence == last_seen_sequence) {
            out.is_duplicate = true;
            Serial.printf("[LoRa-WARN] Duplicate packet #%u from %s (dropping payload, will resend ACK)\n", 
                          out.sequence, out.node_id);
        } else {
            strncpy(last_seen_node, out.node_id, sizeof(last_seen_node));
            last_seen_sequence = out.sequence;
        }

        out.soil_moisture_raw = raw.soil_moisture_raw;
        out.soil_moisture_pct = (float)raw.soil_moisture_pct;
        out.rainfall_pct = (float)raw.rain_intensity_pct;
        out.rain_detected = bool(raw.status_flags & (1 << 0));

        out.tilt_angle_deg = (float)raw.tilt_angle_x100 / 100.0f;
        out.tilt_rate_deg_min = (float)raw.tilt_rate_x1000 / 1000.0f;

        out.accel_x_g = (float)raw.accel_x_mg / 1000.0f;
        out.accel_y_g = (float)raw.accel_y_mg / 1000.0f;
        out.accel_z_g = (float)raw.accel_z_mg / 1000.0f;

        out.battery_mv = raw.battery_mv;
        float v_batt = (float)raw.battery_mv / 1000.0f;
        out.battery_pct = constrain(((v_batt - BATTERY_VOLTAGE_MIN) / (BATTERY_VOLTAGE_MAX - BATTERY_VOLTAGE_MIN)) * 100.0f, 0.0f, 100.0f);

        out.is_valid = true;

        Serial.println(F("-----------------------------------------------------------------"));
        Serial.printf("[LoRa] Packet received (%d bytes, RSSI: %d dBm, SNR: %.1f dB)\n", 
                      packet_size, out.rssi_dbm, out.snr_db);
        Serial.printf("[LoRa] Node: %s | Seq: #%u | Moisture: %.1f%% | Tilt: %.2f° | Rate: %+.4f°/min\n", 
                      out.node_id, out.sequence, out.soil_moisture_pct, out.tilt_angle_deg, out.tilt_rate_deg_min);

        digitalWrite(PIN_STATUS_LED, LOW);
        return true;

    } else {
        // Human-readable string / debug format handling
        String payload = "";
        while (LoRa.available()) {
            payload += (char)LoRa.read();
        }
        Serial.printf("[LoRa-RAW] %d bytes: %s\n", packet_size, payload.c_str());
        digitalWrite(PIN_STATUS_LED, LOW);
        return false;
    }
}

bool LoRaReceiver::sendAck(const char* node_id, uint32_t seq_num) {
    if (!is_ready) return false;

    // Format: "ACK:LG-N01:1042"
    char ack_msg[32];
    snprintf(ack_msg, sizeof(ack_msg), "ACK:%s:%u", node_id, seq_num);

    digitalWrite(PIN_STATUS_LED, HIGH);

    LoRa.beginPacket();
    LoRa.print(ack_msg);
    int res = LoRa.endPacket();

    // Revert back to RX mode immediately
    LoRa.receive();

    digitalWrite(PIN_STATUS_LED, LOW);

    if (res == 1) {
        Serial.printf("[ACK] Sent '%s' to %s\n", ack_msg, node_id);
        return true;
    } else {
        Serial.println(F("[ACK-ERR] Failed to transmit ACK packet"));
        return false;
    }
}
