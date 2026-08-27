#include "telemetry.h"

uint16_t TelemetryBuilder::computeCRC16(const uint8_t* data, size_t length) {
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

size_t TelemetryBuilder::serializeBinary(const TelemetryReport& report, uint8_t* buffer, size_t max_len) {
    if (max_len < sizeof(BinaryTelemetryFrame)) return 0;

    BinaryTelemetryFrame frame;
    memset(&frame, 0, sizeof(frame));

    frame.preamble = 0xAA;
    strncpy(frame.node_id, report.node_id, sizeof(frame.node_id) - 1);
    frame.seq_num = report.sequence;
    frame.soil_moisture_raw = report.soil_moisture_raw;
    frame.soil_moisture_pct = (uint8_t)constrain((int)round(report.soil_moisture_pct), 0, 100);
    frame.rain_intensity_pct = (uint8_t)constrain((int)round(report.rainfall_pct), 0, 100);
    frame.tilt_angle_x100 = (int16_t)round(report.tilt_angle_deg * 100.0f);
    frame.tilt_rate_x1000 = (int16_t)round(report.tilt_rate_deg_min * 1000.0f);
    frame.accel_x_mg = (int16_t)round(report.accel_x_g * 1000.0f);
    frame.accel_y_mg = (int16_t)round(report.accel_y_g * 1000.0f);
    frame.accel_z_mg = (int16_t)round(report.accel_z_g * 1000.0f);
    frame.battery_mv = report.battery_mv;

    frame.status_flags = 0;
    if (report.rain_detected) frame.status_flags |= (1 << 0);
    if (report.imu_online) frame.status_flags |= (1 << 1);
    if (fabs(report.tilt_rate_deg_min) > EMERGENCY_TILT_RATE_THRESH) frame.status_flags |= (1 << 2);

    // Compute CRC16 over packet payload (excluding the CRC field itself)
    frame.crc16 = computeCRC16((const uint8_t*)&frame, sizeof(frame) - sizeof(uint16_t));

    memcpy(buffer, &frame, sizeof(frame));
    return sizeof(frame);
}

String TelemetryBuilder::serializeJson(const TelemetryReport& report) {
    JsonDocument doc;

    doc["node_id"] = report.node_id;
    doc["sequence"] = report.sequence;
    doc["uptime_ms"] = report.uptime_ms;
    
    JsonObject sensors = doc["sensors"].to<JsonObject>();
    sensors["soil_moisture_pct"] = round(report.soil_moisture_pct * 10.0f) / 10.0f;
    sensors["soil_moisture_raw"] = report.soil_moisture_raw;
    sensors["rainfall_pct"] = round(report.rainfall_pct * 10.0f) / 10.0f;
    sensors["rain_detected"] = report.rain_detected;
    sensors["pitch_deg"] = round(report.pitch_deg * 10.0f) / 10.0f;
    sensors["roll_deg"] = round(report.roll_deg * 10.0f) / 10.0f;
    sensors["tilt_angle_deg"] = round(report.tilt_angle_deg * 100.0f) / 100.0f;
    sensors["tilt_rate_deg_min"] = round(report.tilt_rate_deg_min * 1000.0f) / 1000.0f;

    JsonObject battery = doc["battery"].to<JsonObject>();
    battery["voltage_v"] = round(report.battery_v * 100.0f) / 100.0f;
    battery["voltage_mv"] = report.battery_mv;
    battery["level_pct"] = report.battery_pct;

    String jsonStr;
    serializeJson(doc, jsonStr);
    return jsonStr;
}

void TelemetryBuilder::printDebugLog(const TelemetryReport& r) {
    bool is_emergency = (fabs(r.tilt_rate_deg_min) > EMERGENCY_TILT_RATE_THRESH) || (r.soil_moisture_pct > 80.0f && r.rain_detected);

    Serial.println(F("================================================================="));
    Serial.printf("[FRAME #%u] %s | Uptime: %lu ms | State: %s\n", 
                  r.sequence, r.node_id, r.uptime_ms, 
                  is_emergency ? "🚨 HIGH HAZARD / ACCELERATING CREEP" : "🟢 NOMINAL");
    Serial.println(F("-----------------------------------------------------------------"));
    Serial.printf("  • Soil Moisture:    %5.1f %%    (Raw ADC: %u counts)\n", r.soil_moisture_pct, r.soil_moisture_raw);
    Serial.printf("  • Rain Intensity:   %5.1f %%    (Digital Trigger: %s)\n", r.rainfall_pct, r.rain_detected ? "DETECTED" : "DRY");
    Serial.printf("  • Slope Dip Angle:  %5.2f °    (Pitch: %+5.1f°, Roll: %+5.1f°)\n", r.tilt_angle_deg, r.pitch_deg, r.roll_deg);
    Serial.printf("  • Creep Rate:       %+6.4f °/min\n", r.tilt_rate_deg_min);
    Serial.printf("  • Acceleration:     X: %+5.2fg | Y: %+5.2fg | Z: %+5.2fg\n", r.accel_x_g, r.accel_y_g, r.accel_z_g);
    Serial.printf("  • Battery Status:   %5.2f V    (%u mV, %u%%)\n", r.battery_v, r.battery_mv, r.battery_pct);
    Serial.println(F("================================================================="));
}
