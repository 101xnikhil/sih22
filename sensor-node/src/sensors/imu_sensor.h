#ifndef LANDGUARD_IMU_SENSOR_H
#define LANDGUARD_IMU_SENSOR_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>
#include "../config.h"

struct ImuReadings {
    float accel_x;          // X-axis acceleration in g
    float accel_y;          // Y-axis acceleration in g
    float accel_z;          // Z-axis acceleration in g
    float gyro_x;           // X-axis angular rate in °/s
    float gyro_y;           // Y-axis angular rate in °/s
    float gyro_z;           // Z-axis angular rate in °/s
    float pitch_deg;        // Pitch inclination in degrees
    float roll_deg;         // Roll inclination in degrees
    float tilt_angle_deg;   // Resultant spatial slope dip angle β in degrees
    float tilt_rate_deg_min;// Angular displacement creep rate in °/min
};

class ImuSensor {
private:
    Adafruit_MPU6050 mpu;
    bool is_online;
    
    float offset_x;
    float offset_y;
    float offset_z;

    float prev_tilt_deg;
    uint32_t prev_sample_ms;

public:
    ImuSensor();

    bool begin();
    bool isOnline() const { return is_online; }

    ImuReadings readKinematics();
    void calibrateZero(uint8_t samples = 50);
};

#endif // LANDGUARD_IMU_SENSOR_H
