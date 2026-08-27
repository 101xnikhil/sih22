#include "rain_sensor.h"

RainSensor::RainSensor(uint8_t a_pin, uint8_t d_pin, uint16_t dry_cal, uint16_t wet_cal)
    : analog_pin(a_pin), digital_pin(d_pin), adc_dry(dry_cal), adc_wet(wet_cal) {}

void RainSensor::begin() {
    pinMode(analog_pin, INPUT);
    pinMode(digital_pin, INPUT_PULLUP);
    analogSetPinAttenuation(analog_pin, ADC_11db);
    Serial.printf("[RAIN] Initialized -> Analog: GPIO%u, Digital: GPIO%u\n", analog_pin, digital_pin);
}

uint16_t RainSensor::readRaw(uint8_t samples) {
    uint32_t total = 0;
    for (uint8_t i = 0; i < samples; i++) {
        total += analogRead(analog_pin);
        delayMicroseconds(200);
    }
    return (uint16_t)(total / samples);
}

float RainSensor::readIntensityPct(uint8_t samples) {
    uint16_t raw = readRaw(samples);

    // FC-37 output is inverse: higher count = drier plate, lower count = wetter plate
    if (adc_dry <= adc_wet) return 0.0f;

    float pct = (float)(adc_dry - raw) / (float)(adc_dry - adc_wet) * 100.0f;
    return constrain(pct, 0.0f, 100.0f);
}

bool RainSensor::isRaining() {
    // Active LOW digital comparator trigger
    return (digitalRead(digital_pin) == LOW);
}

void RainSensor::setCalibration(uint16_t dry_val, uint16_t wet_val) {
    adc_dry = dry_val;
    adc_wet = wet_val;
    Serial.printf("[RAIN] Calibration updated -> Dry: %u, Wet: %u\n", adc_dry, adc_wet);
}
