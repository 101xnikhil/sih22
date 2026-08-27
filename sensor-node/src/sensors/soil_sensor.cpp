#include "soil_sensor.h"

SoilSensor::SoilSensor(uint8_t analog_pin, uint16_t calib_air, uint16_t calib_water)
    : pin(analog_pin), adc_air(calib_air), adc_water(calib_water) {}

void SoilSensor::begin() {
    pinMode(pin, INPUT);
    analogSetPinAttenuation(pin, ADC_11db); // 0.0V - 3.3V range
    Serial.printf("[SOIL] Initialized on GPIO%u (Air Calib: %u, Water Calib: %u)\n", 
                  pin, adc_air, adc_water);
}

uint16_t SoilSensor::readRaw(uint8_t samples) {
    uint32_t total = 0;
    for (uint8_t i = 0; i < samples; i++) {
        total += analogRead(pin);
        delayMicroseconds(200);
    }
    return (uint16_t)(total / samples);
}

float SoilSensor::readPercent(uint8_t samples) {
    uint16_t raw = readRaw(samples);
    
    // Capacitive sensor V2.0 has inverse relationship:
    // Higher ADC voltage count = Drier soil (lower dielectric capacitance)
    // Lower ADC voltage count = Wetter soil (higher dielectric water content)
    if (adc_air <= adc_water) {
        return 0.0f; // Prevent divide by zero
    }
    
    float pct = (float)(adc_air - raw) / (float)(adc_air - adc_water) * 100.0f;
    return constrain(pct, 0.0f, 100.0f);
}

void SoilSensor::setCalibration(uint16_t air_val, uint16_t water_val) {
    adc_air = air_val;
    adc_water = water_val;
    Serial.printf("[SOIL] Calibration updated -> Air: %u, Water: %u\n", adc_air, adc_water);
}

uint16_t SoilSensor::calibrateAir(uint8_t samples) {
    Serial.println(F("[SOIL] Calibrating Dry Air Baseline (hold sensor dry in air)..."));
    adc_air = readRaw(samples);
    Serial.printf("[SOIL] Calibrated Air Baseline: %u counts\n", adc_air);
    return adc_air;
}

uint16_t SoilSensor::calibrateWater(uint8_t samples) {
    Serial.println(F("[SOIL] Calibrating Water Saturation (submerge probe in water)..."));
    adc_water = readRaw(samples);
    Serial.printf("[SOIL] Calibrated Water Baseline: %u counts\n", adc_water);
    return adc_water;
}
