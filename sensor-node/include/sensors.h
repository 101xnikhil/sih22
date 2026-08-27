#ifndef LANDGUARD_SENSORS_H
#define LANDGUARD_SENSORS_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>
#include "config.h"

struct SensorReadings {
    // Soil Moisture
    uint16_t soil_moisture_raw;
    float soil_moisture_pct;

    // Rain Transducer
    uint16_t rain_raw;
    float rain_intensity_pct;
    bool rain_detected;

    // 6-DOF IMU (MPU6050)
    float accel_x_g;
    float accel_y_g;
    float accel_z_g;
    float gyro_x_dps;
    float gyro_y_dps;
    float gyro_z_dps;

    // Kinematics & Tilt
    float pitch_deg;
    float roll_deg;
    float tilt_angle_deg;       // True resultant spatial inclination dip angle β
    float tilt_rate_deg_min;    // Angular displacement velocity (°/min)

    // Battery Power
    uint16_t battery_mv;
    float battery_pct;

    // Timing
    uint32_t sample_timestamp_ms;
};

class SensorManager {
private:
    Adafruit_MPU6050 mpu;
    bool mpu_online;
    
    float prev_tilt_angle_deg;
    uint32_t prev_sample_time_ms;
    
    // IMU calibration biases
    float accel_bias_x;
    float accel_bias_y;
    float accel_bias_z;

    uint16_t readAveragedADC(uint8_t pin, uint8_t samples = ADC_OVERSAMPLE_COUNT) {
        uint32_t sum = 0;
        for (uint8_t i = 0; i < samples; i++) {
            sum += analogRead(pin);
            delayMicroseconds(250);
        }
        return (uint16_t)(sum / samples);
    }

public:
    SensorManager() : mpu_online(false), prev_tilt_angle_deg(0.0f), prev_sample_time_ms(0),
                      accel_bias_x(0), accel_bias_y(0), accel_bias_z(0) {}

    bool begin() {
        // Configure GPIO modes
        pinMode(PIN_SOIL_MOISTURE_ADC, INPUT);
        pinMode(PIN_RAIN_ANALOG_ADC, INPUT);
        pinMode(PIN_RAIN_DIGITAL_DO, INPUT_PULLUP);
        pinMode(PIN_BATTERY_ADC, INPUT);
        pinMode(PIN_STATUS_LED, OUTPUT);

        // Configure ADC attenuation (11dB gives ~0.0V to 3.3V range on ESP32)
        analogSetPinAttenuation(PIN_SOIL_MOISTURE_ADC, ADC_11db);
        analogSetPinAttenuation(PIN_RAIN_ANALOG_ADC, ADC_11db);
        analogSetPinAttenuation(PIN_BATTERY_ADC, ADC_11db);

        // Initialize I2C Bus for MPU6050
        Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 400000); // 400kHz Fast Mode

        // Initialize MPU6050 IMU
        if (mpu.begin(MPU6050_I2C_ADDR, &Wire)) {
            mpu_online = true;
            mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
            mpu.setGyroRange(MPU6050_RANGE_250_DEG);
            mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
            Serial.println(F("[SENSOR] MPU6050 IMU initialized successfully (±4g, 21Hz DLPF)."));
        } else {
            mpu_online = false;
            Serial.println(F("[WARN] MPU6050 not detected on I2C (0x68). Check wiring."));
        }

        prev_sample_time_ms = millis();
        return true;
    }

    SensorReadings sampleAll() {
        SensorReadings data;
        uint32_t now_ms = millis();
        data.sample_timestamp_ms = now_ms;

        // 1. Read Capacitive Soil Moisture Sensor V2.0
        data.soil_moisture_raw = readAveragedADC(PIN_SOIL_MOISTURE_ADC);
        // Inverse linear mapping: Higher ADC = Dryer, Lower ADC = Wetter
        float moisture_pct = (float)(CALIB_SOIL_ADC_AIR - data.soil_moisture_raw) / 
                             (float)(CALIB_SOIL_ADC_AIR - CALIB_SOIL_ADC_WATER) * 100.0f;
        data.soil_moisture_pct = constrain(moisture_pct, 0.0f, 100.0f);

        // 2. Read FC-37 Rain Sensor
        data.rain_raw = readAveragedADC(PIN_RAIN_ANALOG_ADC);
        data.rain_detected = (digitalRead(PIN_RAIN_DIGITAL_DO) == LOW);
        float rain_pct = (float)(CALIB_RAIN_ADC_DRY - data.rain_raw) / 
                         (float)(CALIB_RAIN_ADC_DRY - CALIB_RAIN_ADC_WET) * 100.0f;
        data.rain_intensity_pct = constrain(rain_pct, 0.0f, 100.0f);

        // 3. Read 6-Axis IMU Kinematics
        if (mpu_online) {
            sensors_event_t a, g, temp;
            mpu.getEvent(&a, &g, &temp);

            // Accelerations in g (standard gravity = 9.80665 m/s²)
            data.accel_x_g = a.acceleration.x / 9.80665f;
            data.accel_y_g = a.acceleration.y / 9.80665f;
            data.accel_z_g = a.acceleration.z / 9.80665f;

            // Angular velocities in °/s (converted from rad/s)
            data.gyro_x_dps = g.gyro.x * 57.2957795f;
            data.gyro_y_dps = g.gyro.y * 57.2957795f;
            data.gyro_z_dps = g.gyro.z * 57.2957795f;

            // Pitch & Roll Calculation
            data.pitch_deg = atan2(data.accel_y_g, sqrt(data.accel_x_g * data.accel_x_g + data.accel_z_g * data.accel_z_g)) * 57.2957795f;
            data.roll_deg = atan2(-data.accel_x_g, data.accel_z_g) * 57.2957795f;

            // True Resultant 3D Dip Angle β from Gravity Vector
            float total_g = sqrt(data.accel_x_g * data.accel_x_g + data.accel_y_g * data.accel_y_g + data.accel_z_g * data.accel_z_g);
            if (total_g > 0.1f) {
                float cos_dip = constrain(data.accel_z_g / total_g, -1.0f, 1.0f);
                data.tilt_angle_deg = acos(cos_dip) * 57.2957795f;
            } else {
                data.tilt_angle_deg = 0.0f;
            }

        } else {
            // Fallback values if IMU not responding
            data.accel_x_g = 0.0f;
            data.accel_y_g = 0.0f;
            data.accel_z_g = 1.0f;
            data.gyro_x_dps = 0.0f;
            data.gyro_y_dps = 0.0f;
            data.gyro_z_dps = 0.0f;
            data.pitch_deg = 0.0f;
            data.roll_deg = 0.0f;
            data.tilt_angle_deg = 20.0f; // Default baseline assumption
        }

        // 4. Calculate Tilt Displacement Creep Rate Δθ/Δt in °/min
        float dt_min = (float)(now_ms - prev_sample_time_ms) / 60000.0f;
        if (dt_min > 0.0001f && prev_sample_time_ms > 0) {
            data.tilt_rate_deg_min = (data.tilt_angle_deg - prev_tilt_angle_deg) / dt_min;
        } else {
            data.tilt_rate_deg_min = 0.0f;
        }
        prev_tilt_angle_deg = data.tilt_angle_deg;
        prev_sample_time_ms = now_ms;

        // 5. Battery Voltage Divider Reading
        uint16_t batt_adc = readAveragedADC(PIN_BATTERY_ADC);
        // Voltage = (ADC / 4095) * 3.3V * DividerRatio
        float v_pin = ((float)batt_adc / 4095.0f) * 3.30f;
        float v_batt = v_pin * BATTERY_DIVIDER_RATIO;
        data.battery_mv = (uint16_t)(v_batt * 1000.0f);
        
        float batt_pct = ((v_batt - BATTERY_VOLTAGE_MIN) / (BATTERY_VOLTAGE_MAX - BATTERY_VOLTAGE_MIN)) * 100.0f;
        data.battery_pct = constrain(batt_pct, 0.0f, 100.0f);

        return data;
    }

    bool isMpuOnline() const { return mpu_online; }
};

#endif // LANDGUARD_SENSORS_H
