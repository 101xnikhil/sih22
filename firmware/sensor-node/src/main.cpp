/**
 * ============================================================================
 * LANDGUARD AI — Modular ESP32 Physical Slope Sensor Node Firmware
 * ============================================================================
 * 
 * Hardware Platform:
 * - ESP32-WROOM-32 (240MHz, 3.3V Logic)
 * - Capacitive Soil Moisture Sensor V2.0 (GPIO34 / ADC1_CH6)
 * - MPU6050 6-Axis IMU (I2C: SDA=GPIO21, SCL=GPIO22, 0x68)
 * - FC-37 / YL-83 Rain Sensor (Analog GPIO35, Digital GPIO14)
 * - Semtech SX1278 433MHz LoRa Transceiver (SPI: SCK=18, MISO=19, MOSI=23, CS=5, RST=16, DIO0=4)
 * - 18650 Li-ion Battery Voltage Divider (GPIO36 / ADC1_CH0)
 * 
 * ⚠️ PROTOTYPE DEMONSTRATION FIRMWARE (SIH 2026)
 * ============================================================================
 */

#include <Arduino.h>
#include "config.h"
#include "sensors/soil_sensor.h"
#include "sensors/imu_sensor.h"
#include "sensors/rain_sensor.h"
#include "telemetry/telemetry.h"
#include "lora/lora_manager.h"

// System Instances
SoilSensor  soilSensor;
ImuSensor   imuSensor;
RainSensor  rainSensor;
LoRaManager loraManager;

// Runtime State
uint32_t packet_sequence = 1;
uint32_t last_transmission_time = 0;

void printSystemHeader() {
    Serial.println();
    Serial.println(F("================================================================="));
    Serial.println(F("    __    ___    _   ______  ________  _____    ____  ____       "));
    Serial.println(F("   / /   /   |  / | / / __ \\/ ____/ / / /   |  / __ \\/ __ \\      "));
    Serial.println(F("  / /   / /| | /  |/ / / / / / __/ / / / /| | / /_/ / / / /      "));
    Serial.println(F(" / /___/ ___ |/ /|  / /_/ / /_/ / /_/ / ___ |/ _, _/ /_/ /       "));
    Serial.println(F("/_____/_/  |_/_/ |_/_____/\\____/\\____/_/  |_/_/ |_/_____/        "));
    Serial.println(F("   AI-POWERED LANDSLIDE EARLY WARNING & SLOPE MONITORING          "));
    Serial.println(F("================================================================="));
    Serial.printf(" Node ID:          %s\n", NODE_ID);
    Serial.printf(" Firmware Version: %s\n", FIRMWARE_VERSION);
    Serial.printf(" LoRa RF Channel:  %.1f MHz (SX1278, SF%d, Sync 0x%02X)\n", 
                  (float)(LORA_FREQUENCY_HZ / 1E6), LORA_SPREADING_FACTOR, LORA_SYNC_WORD);
    Serial.println(F("================================================================="));
    Serial.println();
}

float readBatteryVoltage(uint16_t& out_mv, uint8_t& out_pct) {
    uint32_t sum = 0;
    for (int i = 0; i < 10; i++) {
        sum += analogRead(PIN_BATTERY_ADC);
        delayMicroseconds(200);
    }
    uint16_t adc = sum / 10;
    float v_pin = ((float)adc / 4095.0f) * 3.30f;
    float v_batt = v_pin * BATTERY_DIVIDER_RATIO;
    out_mv = (uint16_t)(v_batt * 1000.0f);
    float pct = ((v_batt - BATTERY_VOLTAGE_MIN) / (BATTERY_VOLTAGE_MAX - BATTERY_VOLTAGE_MIN)) * 100.0f;
    out_pct = (uint8_t)constrain((int)round(pct), 0, 100);
    return v_batt;
}

void checkSerialCommands() {
    if (Serial.available() > 0) {
        char cmd = Serial.read();
        if (cmd == 'c' || cmd == 'C') {
            Serial.println(F("\n--- [CALIBRATION MODE] ---"));
            Serial.println(F("1. Calibrating Dry Air Soil Baseline..."));
            soilSensor.calibrateAir();
            Serial.println(F("2. Calibrating Zero-Tilt IMU Reference..."));
            imuSensor.calibrateZero();
            Serial.println(F("--- Calibration Complete ---\n"));
        } else if (cmd == 'h' || cmd == 'H') {
            Serial.println(F("\n--- [COMMAND MENU] ---"));
            Serial.println(F(" 'c' -> Calibrate Soil & IMU"));
            Serial.println(F(" 'h' -> Print Help Menu"));
            Serial.println(F("----------------------\n"));
        }
    }
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    printSystemHeader();

    // 1. Initialize Status LED
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, HIGH);

    // 2. Initialize Physical Transducer Modules
    Serial.println(F("[INIT] Initializing Physical Transducers..."));
    soilSensor.begin();
    imuSensor.begin();
    rainSensor.begin();

    // 3. Initialize Battery ADC
    pinMode(PIN_BATTERY_ADC, INPUT);
    analogSetPinAttenuation(PIN_BATTERY_ADC, ADC_11db);

    // 4. Initialize LoRa RF Radio
    Serial.println(F("[INIT] Initializing LoRa SX1278 Radio..."));
    if (loraManager.begin()) {
        Serial.println(F("[INIT] LoRa Radio Link Ready."));
    } else {
        Serial.println(F("[WARN] LoRa Radio offline. Node will operate in Serial-only mode."));
    }

    // Startup LED Blinking Sequence
    for (int i = 0; i < 3; i++) {
        digitalWrite(PIN_STATUS_LED, LOW);
        delay(80);
        digitalWrite(PIN_STATUS_LED, HIGH);
        delay(80);
    }
    digitalWrite(PIN_STATUS_LED, LOW);

    Serial.println(F("[STATUS] Node entering continuous monitoring loop (Send 'c' to calibrate)...\n"));
}

void loop() {
    uint32_t now = millis();
    checkSerialCommands();

    // Check sampling duty cycle interval
    if (now - last_transmission_time >= TELEMETRY_INTERVAL_MS || last_transmission_time == 0) {
        last_transmission_time = now;

        // 1. Sample Physical Transducers
        uint16_t soil_raw = soilSensor.readRaw();
        float soil_pct = soilSensor.readPercent();

        ImuReadings imu = imuSensor.readKinematics();

        float rain_intensity = rainSensor.readIntensityPct();
        bool is_raining = rainSensor.isRaining();

        uint16_t batt_mv = 0;
        uint8_t batt_pct = 0;
        float batt_v = readBatteryVoltage(batt_mv, batt_pct);

        // 2. Assemble Telemetry Report
        TelemetryReport report;
        strncpy(report.node_id, NODE_ID, sizeof(report.node_id) - 1);
        report.sequence = packet_sequence;
        report.uptime_ms = now;

        report.soil_moisture_pct = soil_pct;
        report.soil_moisture_raw = soil_raw;

        report.rainfall_pct = rain_intensity;
        report.rain_detected = is_raining;

        report.pitch_deg = imu.pitch_deg;
        report.roll_deg = imu.roll_deg;
        report.tilt_angle_deg = imu.tilt_angle_deg;
        report.tilt_rate_deg_min = imu.tilt_rate_deg_min;

        report.accel_x_g = imu.accel_x;
        report.accel_y_g = imu.accel_y;
        report.accel_z_g = imu.accel_z;
        report.gyro_x_dps = imu.gyro_x;
        report.gyro_y_dps = imu.gyro_y;
        report.gyro_z_dps = imu.gyro_z;

        report.battery_v = batt_v;
        report.battery_mv = batt_mv;
        report.battery_pct = batt_pct;
        report.imu_online = imuSensor.isOnline();

        // 3. Print Serial Debug Diagnostics
        TelemetryBuilder::printDebugLog(report);

        // 4. Transmit Telemetry over LoRa with ACK and Retry
        if (loraManager.isReady()) {
            bool ack_ok = loraManager.sendTelemetry(report, true, LORA_MAX_TX_RETRIES);
            if (!ack_ok) {
                Serial.println(F("[STATUS] Node will re-attempt sync on next duty cycle."));
            }
        }

        packet_sequence++;
    }

    delay(20);
}
