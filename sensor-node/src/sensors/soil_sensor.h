#ifndef LANDGUARD_SOIL_SENSOR_H
#define LANDGUARD_SOIL_SENSOR_H

#include <Arduino.h>
#include "../config.h"

class SoilSensor {
private:
    uint8_t pin;
    uint16_t adc_air;
    uint16_t adc_water;

public:
    SoilSensor(uint8_t analog_pin = PIN_SOIL_MOISTURE_ADC,
               uint16_t calib_air = DEFAULT_SOIL_ADC_AIR,
               uint16_t calib_water = DEFAULT_SOIL_ADC_WATER);

    void begin();
    uint16_t readRaw(uint8_t samples = ADC_OVERSAMPLING_SAMPLES);
    float readPercent(uint8_t samples = ADC_OVERSAMPLING_SAMPLES);
    
    // In-situ Calibration Methods
    void setCalibration(uint16_t air_val, uint16_t water_val);
    uint16_t calibrateAir(uint8_t samples = 20);
    uint16_t calibrateWater(uint8_t samples = 20);
    
    uint16_t getAirValue() const { return adc_air; }
    uint16_t getWaterValue() const { return adc_water; }
};

#endif // LANDGUARD_SOIL_SENSOR_H
