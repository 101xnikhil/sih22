#include "imu_sensor.h"

ImuSensor::ImuSensor()
    : is_online(false), offset_x(0.0f), offset_y(0.0f), offset_z(0.0f),
      prev_tilt_deg(0.0f), prev_sample_ms(0) {}

bool ImuSensor::begin() {
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 400000); // 400kHz Fast Mode I2C

    if (mpu.begin(MPU6050_I2C_ADDRESS, &Wire)) {
        is_online = true;
        mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
        mpu.setGyroRange(MPU6050_RANGE_250_DEG);
        mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
        Serial.println(F("[IMU] MPU6050 initialized successfully on I2C (0x68)."));
        prev_sample_ms = millis();
        return true;
    } else {
        is_online = false;
        Serial.println(F("[WARN] MPU6050 not detected at 0x68. Check SDA/SCL wiring."));
        return false;
    }
}

ImuReadings ImuSensor::readKinematics() {
    ImuReadings data;
    uint32_t now = millis();

    if (is_online) {
        sensors_event_t a, g, temp;
        mpu.getEvent(&a, &g, &temp);

        // Convert standard gravity (9.80665 m/s² -> g)
        data.accel_x = (a.acceleration.x / 9.80665f) - offset_x;
        data.accel_y = (a.acceleration.y / 9.80665f) - offset_y;
        data.accel_z = (a.acceleration.z / 9.80665f) - offset_z;

        // Convert rad/s -> °/s
        data.gyro_x = g.gyro.x * 57.2957795f;
        data.gyro_y = g.gyro.y * 57.2957795f;
        data.gyro_z = g.gyro.z * 57.2957795f;

        // 1. Pitch and Roll Trigonometric Derivation
        data.pitch_deg = atan2(data.accel_y, sqrt(data.accel_x * data.accel_x + data.accel_z * data.accel_z)) * 57.2957795f;
        data.roll_deg = atan2(-data.accel_x, data.accel_z) * 57.2957795f;

        // 2. Resultant 3D Dip Angle β from Gravity Vector Normal
        float total_g = sqrt(data.accel_x * data.accel_x + data.accel_y * data.accel_y + data.accel_z * data.accel_z);
        if (total_g > 0.05f) {
            float cos_dip = constrain(data.accel_z / total_g, -1.0f, 1.0f);
            data.tilt_angle_deg = acos(cos_dip) * 57.2957795f;
        } else {
            data.tilt_angle_deg = 0.0f;
        }

    } else {
        // Fallback baseline for prototype simulation if IMU unplugged
        data.accel_x = 0.0f;
        data.accel_y = 0.0f;
        data.accel_z = 1.0f;
        data.gyro_x = 0.0f;
        data.gyro_y = 0.0f;
        data.gyro_z = 0.0f;
        data.pitch_deg = 0.0f;
        data.roll_deg = 0.0f;
        data.tilt_angle_deg = 20.0f; // Nominal baseline
    }

    // 3. Angular Displacement Creep Rate (Δθ/Δt in °/min)
    float dt_min = (float)(now - prev_sample_ms) / 60000.0f;
    if (dt_min > 0.0001f && prev_sample_ms > 0) {
        data.tilt_rate_deg_min = (data.tilt_angle_deg - prev_tilt_deg) / dt_min;
    } else {
        data.tilt_rate_deg_min = 0.0f;
    }

    prev_tilt_deg = data.tilt_angle_deg;
    prev_sample_ms = now;

    return data;
}

void ImuSensor::calibrateZero(uint8_t samples) {
    if (!is_online) return;

    Serial.println(F("[IMU] Calibrating zero tilt offset on level surface..."));
    float sum_x = 0, sum_y = 0, sum_z = 0;

    for (uint8_t i = 0; i < samples; i++) {
        sensors_event_t a, g, temp;
        mpu.getEvent(&a, &g, &temp);
        sum_x += a.acceleration.x / 9.80665f;
        sum_y += a.acceleration.y / 9.80665f;
        sum_z += (a.acceleration.z / 9.80665f) - 1.0f; // Expect 1g downwards on Z
        delay(20);
    }

    offset_x = sum_x / samples;
    offset_y = sum_y / samples;
    offset_z = sum_z / samples;

    Serial.printf("[IMU] Zero Offsets -> X: %+5.3f g, Y: %+5.3f g, Z: %+5.3f g\n", 
                  offset_x, offset_y, offset_z);
}
