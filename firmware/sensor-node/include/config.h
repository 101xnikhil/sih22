#ifndef LANDGUARD_CONFIG_H
#define LANDGUARD_CONFIG_H

#include <Arduino.h>

// ============================================================================
// LANDGUARD AI — ESP32 Sensor Node Hardware Configuration
// ============================================================================

// --- Station & Identification ---
#define LANDGUARD_NODE_ID       "LG-N01"
#define LANDGUARD_FW_VERSION    "v0.1.4-proto"

// --- GPIO Pinout Mapping ---
// 1. Capacitive Soil Moisture Sensor V2.0 (ADC1 only — WiFi/LoRa safe)
#define PIN_SOIL_MOISTURE_ADC   34      // ADC1_CHANNEL_6

// 2. FC-37 / YL-83 Rain Sensor
#define PIN_RAIN_ANALOG_ADC     35      // ADC1_CHANNEL_7
#define PIN_RAIN_DIGITAL_DO     14      // Active LOW when water bridges contacts

// 3. Battery Voltage Divider (100kΩ / 100kΩ to Li-ion 3.7V / 4.2V)
#define PIN_BATTERY_ADC         36      // ADC1_CHANNEL_0 (VP)

// 4. MPU6050 6-DOF IMU (I2C Bus)
#define PIN_I2C_SDA             21
#define PIN_I2C_SCL             22
#define MPU6050_I2C_ADDR        0x68

// 5. LoRa SX1278 433MHz Transceiver (SPI Bus)
#define PIN_LORA_SCK            18
#define PIN_LORA_MISO           19
#define PIN_LORA_MOSI           23
#define PIN_LORA_SS             5
#define PIN_LORA_RST            16
#define PIN_LORA_DIO0           4

// 6. Diagnostics & Status Indicator
#define PIN_STATUS_LED          2       // Onboard Blue LED (Active HIGH)

// --- Transducer Calibration Constants ---
// Capacitive Soil Moisture Sensor (12-bit ADC: 0 - 4095)
#define CALIB_SOIL_ADC_AIR      3200    // Raw count in dry ambient air (0% moisture)
#define CALIB_SOIL_ADC_WATER    1100    // Raw count submerged in water (100% moisture)

// Rain Sensor Calibration
#define CALIB_RAIN_ADC_DRY      4095    // Dry sensor plates (0% rain)
#define CALIB_RAIN_ADC_WET      1200    // Completely covered / flooded (100% rain)

// Battery Monitoring
#define BATTERY_DIVIDER_RATIO   2.0f    // (R1 + R2) / R2 = (100k + 100k) / 100k
#define BATTERY_VOLTAGE_MAX     4.20f   // 100% charge (4200 mV)
#define BATTERY_VOLTAGE_MIN     3.30f   // 0% cutoff (3300 mV)

// --- Kinematic & Stability Thresholds ---
#define COMPLEMENTARY_ALPHA     0.96f   // Weight of gyro vs accel in tilt fusion
#define EMERGENCY_TILT_RATE     0.05f   // °/min threshold to enter high-frequency mode
#define SEISMIC_ACCEL_DELTA     0.30f   // g threshold for sudden shock detection

// --- LoRa Radio Parameters ---
#define LORA_FREQUENCY_HZ       433E6   // 433.0 MHz ISM band (Asia/Europe)
#define LORA_SYNC_WORD          0xF3    // LANDGUARD Private Network Sync Word
#define LORA_SPREADING_FACTOR   7       // SF7 (Fast, low power) or SF9 (Long range)
#define LORA_SIGNAL_BANDWIDTH   125E3   // 125 kHz
#define LORA_CODING_RATE_4      5       // 4/5 forward error correction
#define LORA_TX_POWER_DBM       17      // 17 dBm (+50 mW)

// --- Operational Duty Cycle Timing ---
#define SAMPLE_INTERVAL_NORMAL_MS   5000   // Normal sampling interval (5 seconds for demo)
#define SAMPLE_INTERVAL_CRISIS_MS   1500   // Accelerated crisis sampling interval (1.5 seconds)
#define ADC_OVERSAMPLE_COUNT        10     // 10-sample moving average for ADC noise rejection

#endif // LANDGUARD_CONFIG_H
