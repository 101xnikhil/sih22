#ifndef LANDGUARD_LORA_TX_H
#define LANDGUARD_LORA_TX_H

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include <ArduinoJson.h>
#include "config.h"
#include "sensors.h"

// Compact 32-Byte Binary LoRa Payload Struct (Optimized for minimal airtime)
#pragma pack(push, 1)
struct LoRaTelemetryPacket {
    uint8_t  preamble;              // 0xAA Magic Header
    char     node_id[8];            // "LG-N01\0"
    uint32_t seq_num;               // Packet sequence counter
    uint16_t soil_moisture_raw;     // 12-bit ADC count
    uint8_t  soil_moisture_pct;     // 0 - 100 %
    uint8_t  rain_intensity_pct;    // 0 - 100 %
    int16_t  tilt_angle_x100;       // Angle * 100 (e.g. 2480 = 24.80°)
    int16_t  tilt_rate_x1000;       // Rate * 1000 (e.g. 45 = 0.045 °/min)
    int16_t  accel_x_mg;            // X-acceleration in milli-g
    int16_t  accel_y_mg;            // Y-acceleration in milli-g
    int16_t  accel_z_mg;            // Z-acceleration in milli-g
    uint16_t battery_mv;            // Voltage in mV (e.g. 3850 mV)
    uint8_t  status_flags;          // Bit 0: Rain, Bit 1: IMU OK, Bit 2: Critical Creep
    uint16_t crc16;                 // CCITT-16 Checksum
};
#pragma pack(pop)

class LoRaTransmitter {
private:
    bool lora_ready;

    uint16_t computeCRC16(const uint8_t* data, size_t length) {
        uint16_t crc = 0xFFFF;
        for (size_t i = 0; i < length; i++) {
            crc ^= (uint16_t)data[i];
            for (uint8_t j = 0; j < 8; j++) {
                if (crc & 0x0001) {
                    crc = (crc >> 1) ^ 0xA001;
                } else {
                    crc = crc >> 1;
                }
            }
        }
        return crc;
    }

public:
    LoRaTransmitter() : lora_ready(false) {}

    bool begin() {
        // Set SPI Pins for LoRa Transceiver
        SPI.begin(PIN_LORA_SCK, PIN_LORA_MISO, PIN_LORA_MOSI, PIN_LORA_SS);
        LoRa.setPins(PIN_LORA_SS, PIN_LORA_RST, PIN_LORA_DIO0);

        if (!LoRa.begin(LORA_FREQUENCY_HZ)) {
            Serial.println(F("[ERROR] LoRa SX1278 initialization failed! Check SPI wiring."));
            lora_ready = false;
            return false;
        }

        // Configure RF Modem Parameters
        LoRa.setSyncWord(LORA_SYNC_WORD);
        LoRa.setSpreadingFactor(LORA_SPREADING_FACTOR);
        LoRa.setSignalBandwidth(LORA_SIGNAL_BANDWIDTH);
        LoRa.setCodingRate4(LORA_CODING_RATE_4);
        LoRa.setTxPower(LORA_TX_POWER_DBM);
        LoRa.enableCrc();

        lora_ready = true;
        Serial.println(F("[LORA] SX1278 RF Radio ready @ 433.0 MHz (SF7, BW 125kHz, CR 4/5, +17dBm)."));
        return true;
    }

    bool transmitBinary(const SensorReadings& data, uint32_t seq_num, bool imu_ok) {
        if (!lora_ready) return false;

        LoRaTelemetryPacket pkt;
        memset(&pkt, 0, sizeof(pkt));

        pkt.preamble = 0xAA;
        strncpy(pkt.node_id, LANDGUARD_NODE_ID, sizeof(pkt.node_id) - 1);
        pkt.seq_num = seq_num;
        pkt.soil_moisture_raw = data.soil_moisture_raw;
        pkt.soil_moisture_pct = (uint8_t)constrain((int)round(data.soil_moisture_pct), 0, 100);
        pkt.rain_intensity_pct = (uint8_t)constrain((int)round(data.rain_intensity_pct), 0, 100);
        pkt.tilt_angle_x100 = (int16_t)round(data.tilt_angle_deg * 100.0f);
        pkt.tilt_rate_x1000 = (int16_t)round(data.tilt_rate_deg_min * 1000.0f);
        pkt.accel_x_mg = (int16_t)round(data.accel_x_g * 1000.0f);
        pkt.accel_y_mg = (int16_t)round(data.accel_y_g * 1000.0f);
        pkt.accel_z_mg = (int16_t)round(data.accel_z_g * 1000.0f);
        pkt.battery_mv = data.battery_mv;

        // Flags: bit 0 = rain detected, bit 1 = IMU online, bit 2 = high creep
        pkt.status_flags = 0;
        if (data.rain_detected) pkt.status_flags |= (1 << 0);
        if (imu_ok) pkt.status_flags |= (1 << 1);
        if (fabs(data.tilt_rate_deg_min) > EMERGENCY_TILT_RATE) pkt.status_flags |= (1 << 2);

        // Compute CRC16 over packet payload (excluding the CRC field itself)
        pkt.crc16 = computeCRC16((const uint8_t*)&pkt, sizeof(pkt) - sizeof(uint16_t));

        // Blink Status LED during RF TX
        digitalWrite(PIN_STATUS_LED, HIGH);

        LoRa.beginPacket();
        LoRa.write((const uint8_t*)&pkt, sizeof(pkt));
        int tx_res = LoRa.endPacket();

        digitalWrite(PIN_STATUS_LED, LOW);

        if (tx_res == 1) {
            Serial.printf("[TX] Packet #%u sent (%d bytes, CRC 0x%04X)\n", seq_num, sizeof(pkt), pkt.crc16);
            return true;
        } else {
            Serial.println(F("[ERROR] LoRa packet transmission timed out."));
            return false;
        }
    }

    bool transmitJson(const SensorReadings& data, uint32_t seq_num, bool imu_ok) {
        if (!lora_ready) return false;

        JsonDocument doc;
        doc["node_id"] = LANDGUARD_NODE_ID;
        doc["seq_num"] = seq_num;
        doc["soil_moisture"] = round(data.soil_moisture_pct * 10.0f) / 10.0f;
        doc["soil_moisture_raw"] = data.soil_moisture_raw;
        doc["rainfall"] = round(data.rain_intensity_pct * 10.0f) / 10.0f;
        doc["rain_detected"] = data.rain_detected;
        doc["tilt_angle"] = round(data.tilt_angle_deg * 100.0f) / 100.0f;
        doc["tilt_rate"] = round(data.tilt_rate_deg_min * 1000.0f) / 1000.0f;
        doc["battery"] = round(data.battery_pct);
        doc["battery_mv"] = data.battery_mv;

        JsonObject accel = doc["accel"].to<JsonObject>();
        accel["x"] = round(data.accel_x_g * 100.0f) / 100.0f;
        accel["y"] = round(data.accel_y_g * 100.0f) / 100.0f;
        accel["z"] = round(data.accel_z_g * 100.0f) / 100.0f;

        String jsonPayload;
        serializeJson(doc, jsonPayload);

        digitalWrite(PIN_STATUS_LED, HIGH);
        LoRa.beginPacket();
        LoRa.print(jsonPayload);
        int tx_res = LoRa.endPacket();
        digitalWrite(PIN_STATUS_LED, LOW);

        if (tx_res == 1) {
            Serial.printf("[TX-JSON] #%u: %s\n", seq_num, jsonPayload.c_str());
            return true;
        }
        return false;
    }

    bool isReady() const { return lora_ready; }
};

#endif // LANDGUARD_LORA_TX_H
