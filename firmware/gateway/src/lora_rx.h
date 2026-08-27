#ifndef LANDGUARD_GATEWAY_LORA_RX_H
#define LANDGUARD_GATEWAY_LORA_RX_H

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include "config.h"

// 32-Byte Packed Binary Telemetry Frame
#pragma pack(push, 1)
struct RawLoRaPacket {
    uint8_t  preamble;              // 0xAA Magic Header
    char     node_id[8];            // "LG-N01\0"
    uint32_t seq_num;               // Packet sequence counter
    uint16_t soil_moisture_raw;     // 12-bit ADC count (0 - 4095)
    uint8_t  soil_moisture_pct;     // 0 - 100 %
    uint8_t  rain_intensity_pct;    // 0 - 100 %
    int16_t  tilt_angle_x100;       // Angle * 100 (e.g. 2480 = 24.80°)
    int16_t  tilt_rate_x1000;       // Rate * 1000 (e.g. 45 = 0.045 °/min)
    int16_t  accel_x_mg;            // X-acceleration in milli-g
    int16_t  accel_y_mg;            // Y-acceleration in milli-g
    int16_t  accel_z_mg;            // Z-acceleration in milli-g
    uint16_t battery_mv;            // Battery voltage in mV (3300 - 4200 mV)
    uint8_t  status_flags;          // Bit 0: Rain, Bit 1: IMU OK, Bit 2: Rapid Creep
    uint16_t crc16;                 // CCITT-16 Checksum
};
#pragma pack(pop)

struct DecodedPacket {
    char node_id[8];
    uint32_t sequence;
    
    float soil_moisture_pct;
    uint16_t soil_moisture_raw;
    
    float rainfall_pct;
    bool rain_detected;
    
    float tilt_angle_deg;
    float tilt_rate_deg_min;
    
    float accel_x_g;
    float accel_y_g;
    float accel_z_g;
    
    uint16_t battery_mv;
    float battery_pct;
    
    int rssi_dbm;
    float snr_db;
    
    bool is_duplicate;
    bool is_valid;
};

class LoRaReceiver {
private:
    bool is_ready;
    uint32_t last_seen_sequence;
    char last_seen_node[8];

    uint16_t computeCRC16(const uint8_t* data, size_t length);

public:
    LoRaReceiver();

    bool begin();
    bool isReady() const { return is_ready; }

    // Check and parse incoming packet (returns true if valid packet received)
    bool receivePacket(DecodedPacket& out_packet);

    // Send immediate acknowledgment back to the sensor node
    bool sendAck(const char* node_id, uint32_t seq_num);
};

#endif // LANDGUARD_GATEWAY_LORA_RX_H
