#ifndef LANDGUARD_CONFIG_H
#define LANDGUARD_CONFIG_H

#include <Arduino.h>

// ============================================================================
// LANDGUARD AI — ESP32 Sensor Node Hardware Configuration (LG-N01)
// ============================================================================

// --- Node Identification ---
#define NODE_ID                     "LG-N01"
#define FIRMWARE_VERSION            "v0.2.0-modular"

// --- GPIO Pinout Definitions ---
// Note: ESP32 ADC1 pins (GPIO 32-39) are used for analog transducers because
// ADC2 cannot be used simultaneously with WiFi/LoRa RF operations.

// 1. Capacitive Soil Moisture Sensor V2.0
#define PIN_SOIL_MOISTURE_ADC       34      // ADC1_CH6 (Analog input only, no internal pull-up)

// 2. FC-37 / YL-83 Rain Sensor
#define PIN_RAIN_ANALOG_ADC         35      // ADC1_CH7 (Analog rain intensity)
#define PIN_RAIN_DIGITAL_DO         14      // Digital rain trigger (Active LOW)

// 3. 18650 Li-ion Battery Voltage Divider (100kΩ / 100kΩ)
#define PIN_BATTERY_ADC             36      // ADC1_CH0 / SENSOR_VP

// 4. MPU6050 6-Axis IMU (I2C Bus)
#define PIN_I2C_SDA                 21      // Hardware I2C SDA
#define PIN_I2C_SCL                 22      // Hardware I2C SCL
#define MPU6050_I2C_ADDRESS         0x68    // AD0 tied to GND

// 5. LoRa SX1278 433MHz Transceiver (SPI Bus)
#define PIN_LORA_SCK                18      // VSPI SCK
#define PIN_LORA_MISO               19      // VSPI MISO
#define PIN_LORA_MOSI               23      // VSPI MOSI
#define PIN_LORA_SS                 5       // Chip Select (NSS)
#define PIN_LORA_RST                16      // Radio Reset (NRESET)
#define PIN_LORA_DIO0               4       // Packet TX/RX Done Interrupt

// 6. Diagnostics
#define PIN_STATUS_LED              2       // Onboard Blue LED

// --- Transducer Calibration Constants ---
// Soil Moisture (12-bit ADC: 0 - 4095)
#define DEFAULT_SOIL_ADC_AIR        3200    // Raw count in dry ambient air (0% moisture)
#define DEFAULT_SOIL_ADC_WATER      1100    // Raw count submerged in water (100% moisture)

// Rain Sensor (12-bit ADC)
#define DEFAULT_RAIN_ADC_DRY        4095    // Dry sensor surface (0% rain)
#define DEFAULT_RAIN_ADC_WET        1200    // Flooded surface (100% rain)

// Battery Monitoring
#define BATTERY_DIVIDER_RATIO       2.0f    // (R1 + R2) / R2 = (100k + 100k) / 100k
#define BATTERY_VOLTAGE_MAX         4.20f   // 100% Li-ion charge
#define BATTERY_VOLTAGE_MIN         3.30f   // 0% cutoff threshold

// --- Kinematics & Tilt Parameters ---
#define ADC_OVERSAMPLING_SAMPLES    10      // Moving average noise filter count
#define EMERGENCY_TILT_RATE_THRESH  0.05f   // °/min threshold for rapid creep detection

// --- LoRa Radio Configuration ---
#define LORA_FREQUENCY_HZ           433E6   // 433.0 MHz (Asia / India ISM Band)
#define LORA_SYNC_WORD              0xF3    // LANDGUARD Private Network Sync Word
#define LORA_SPREADING_FACTOR       7       // SF7 (Fast, low power)
#define LORA_SIGNAL_BANDWIDTH       125E3   // 125 kHz
#define LORA_CODING_RATE_4          5       // 4/5 forward error correction
#define LORA_TX_POWER_DBM           17      // +17 dBm (+50 mW)

// --- ACK & Retry Protocol ---
#define LORA_ACK_TIMEOUT_MS         1500    // Wait time for gateway ACK packet
#define LORA_MAX_TX_RETRIES         3       // Maximum transmission attempts per packet
#define TELEMETRY_INTERVAL_MS       5000    // Telemetry transmission interval (5 seconds)

#endif // LANDGUARD_CONFIG_H
