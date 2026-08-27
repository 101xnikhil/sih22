#ifndef LANDGUARD_RAIN_SENSOR_H
#define LANDGUARD_RAIN_SENSOR_H

#include <Arduino.h>
#include "../config.h"

class RainSensor {
private:
    uint8_t analog_pin;
    uint8_t digital_pin;
    uint16_t adc_dry;
    uint16_t adc_wet;

public:
    RainSensor(uint8_t a_pin = PIN_RAIN_ANALOG_ADC,
               uint8_t d_pin = PIN_RAIN_DIGITAL_DO,
               uint16_t dry_cal = DEFAULT_RAIN_ADC_DRY,
               uint16_t wet_cal = DEFAULT_RAIN_ADC_WET);

    void begin();
    uint16_t readRaw(uint8_t samples = ADC_OVERSAMPLING_SAMPLES);
    float readIntensityPct(uint8_t samples = ADC_OVERSAMPLING_SAMPLES);
    bool isRaining();
    
    void setCalibration(uint16_t dry_val, uint16_t wet_val);
};

#endif // LANDGUARD_RAIN_SENSOR_H
