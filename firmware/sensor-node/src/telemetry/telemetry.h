#ifndef LANDGUARD_TELEMETRY_H
#define LANDGUARD_TELEMETRY_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "../config.h"

// 32-Byte Packed Binary Struct for LoRa
#pragma pack(push, 1)
struct BinaryTelemetryFrame {
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

struct TelemetryReport {
    char node_id[8];
    uint32_t sequence;
    uint32_t uptime_ms;

    float soil_moisture_pct;
    uint16_t soil_moisture_raw;

    float rainfall_pct;
    bool rain_detected;

    float pitch_deg;
    float roll_deg;
    float tilt_angle_deg;
    float tilt_rate_deg_min;

    float accel_x_g;
    float accel_y_g;
    float accel_z_g;
    float gyro_x_dps;
    float gyro_y_dps;
    float gyro_z_dps;

    float battery_v;
    uint8_t battery_pct;
    uint16_t battery_mv;

    bool imu_online;
};

class TelemetryBuilder {
public:
    static size_t serializeBinary(const TelemetryReport& report, uint8_t* buffer, size_t max_len);
    static String serializeJson(const TelemetryReport& report);
    static void printDebugLog(const TelemetryReport& report);
    static uint16_t computeCRC16(const uint8_t* data, size_t length);
};

#endif // LANDGUARD_TELEMETRY_H
