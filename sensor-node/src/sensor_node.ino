/**
 * LANDGUARD AI — Single-File Arduino IDE Sensor Node Sketch
 * For flashing with Arduino IDE (Select "ESP32 Dev Module").
 * Requires Libraries:
 * - LoRa by Sandeep Mistry
 * - Adafruit MPU6050
 * - ArduinoJson by Benoit Blanchon
 */

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <LoRa.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>

// Pin Definitions
#define PIN_SOIL_ADC       34
#define PIN_RAIN_ADC       35
#define PIN_RAIN_DO        14
#define PIN_BATTERY_ADC    36
#define PIN_LED            2
#define PIN_I2C_SDA        21
#define PIN_I2C_SCL        22
#define PIN_LORA_SCK       18
#define PIN_LORA_MISO      19
#define PIN_LORA_MOSI      23
#define PIN_LORA_SS        5
#define PIN_LORA_RST       16
#define PIN_LORA_DIO0      4

// Calibration Constants
#define SOIL_AIR_ADC       3200
#define SOIL_WATER_ADC     1100
#define RAIN_DRY_ADC       4095
#define RAIN_WET_ADC       1200
#define BATT_RATIO         2.0f

Adafruit_MPU6050 mpu;
bool mpu_ready = false;
bool lora_ready = false;
uint32_t seq = 1;
float prev_angle = 20.0f;
uint32_t last_sample_time = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[LANDGUARD AI] Initializing Node LG-N01...");

  pinMode(PIN_SOIL_ADC, INPUT);
  pinMode(PIN_RAIN_ADC, INPUT);
  pinMode(PIN_RAIN_DO, INPUT_PULLUP);
  pinMode(PIN_BATTERY_ADC, INPUT);
  pinMode(PIN_LED, OUTPUT);

  analogSetPinAttenuation(PIN_SOIL_ADC, ADC_11db);
  analogSetPinAttenuation(PIN_RAIN_ADC, ADC_11db);
  analogSetPinAttenuation(PIN_BATTERY_ADC, ADC_11db);

  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  if (mpu.begin(0x68, &Wire)) {
    mpu_ready = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("[OK] MPU6050 Online");
  }

  SPI.begin(PIN_LORA_SCK, PIN_LORA_MISO, PIN_LORA_MOSI, PIN_LORA_SS);
  LoRa.setPins(PIN_LORA_SS, PIN_LORA_RST, PIN_LORA_DIO0);
  if (LoRa.begin(433E6)) {
    lora_ready = true;
    LoRa.setSyncWord(0xF3);
    LoRa.setSpreadingFactor(7);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setTxPower(17);
    Serial.println("[OK] LoRa 433MHz Online");
  }
}

void loop() {
  uint32_t now = millis();
  if (now - last_sample_time >= 5000 || last_sample_time == 0) {
    last_sample_time = now;

    // Soil Moisture
    uint16_t soil_raw = analogRead(PIN_SOIL_ADC);
    float soil_pct = constrain(((float)(SOIL_AIR_ADC - soil_raw) / (float)(SOIL_AIR_ADC - SOIL_WATER_ADC)) * 100.0f, 0.0f, 100.0f);

    // Rain
    uint16_t rain_raw = analogRead(PIN_RAIN_ADC);
    bool rain_det = (digitalRead(PIN_RAIN_DO) == LOW);
    float rain_pct = constrain(((float)(RAIN_DRY_ADC - rain_raw) / (float)(RAIN_DRY_ADC - RAIN_WET_ADC)) * 100.0f, 0.0f, 100.0f);

    // IMU Kinematics
    float ax = 0, ay = 0, az = 1.0;
    float dip_angle = 22.0f;
    if (mpu_ready) {
      sensors_event_t a, g, temp;
      mpu.getEvent(&a, &g, &temp);
      ax = a.acceleration.x / 9.80665f;
      ay = a.acceleration.y / 9.80665f;
      az = a.acceleration.z / 9.80665f;
      float total_g = sqrt(ax * ax + ay * ay + az * az);
      if (total_g > 0.1f) {
        dip_angle = acos(constrain(az / total_g, -1.0f, 1.0f)) * 57.2957795f;
      }
    }

    float rate = (dip_angle - prev_angle) * 12.0f; // scaled °/min
    prev_angle = dip_angle;

    // Battery
    uint16_t batt_adc = analogRead(PIN_BATTERY_ADC);
    float v_batt = ((float)batt_adc / 4095.0f) * 3.30f * BATT_RATIO;
    uint16_t batt_mv = (uint16_t)(v_batt * 1000.0f);
    float batt_pct = constrain(((v_batt - 3.3f) / (4.2f - 3.3f)) * 100.0f, 0.0f, 100.0f);

    // JSON Payload
    JsonDocument doc;
    doc["node_id"] = "LG-N01";
    doc["seq_num"] = seq++;
    doc["soil_moisture"] = round(soil_pct * 10.0f) / 10.0f;
    doc["soil_moisture_raw"] = soil_raw;
    doc["rainfall"] = round(rain_pct * 10.0f) / 10.0f;
    doc["rain_detected"] = rain_det;
    doc["tilt_angle"] = round(dip_angle * 100.0f) / 100.0f;
    doc["tilt_rate"] = round(rate * 1000.0f) / 1000.0f;
    doc["battery"] = round(batt_pct);
    doc["battery_mv"] = batt_mv;

    String jsonOut;
    serializeJson(doc, jsonOut);

    Serial.println(jsonOut);

    if (lora_ready) {
      digitalWrite(PIN_LED, HIGH);
      LoRa.beginPacket();
      LoRa.print(jsonOut);
      LoRa.endPacket();
      digitalWrite(PIN_LED, LOW);
    }
  }
  delay(50);
}
