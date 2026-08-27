# LANDGUARD AI — ESP32 Sensor Node Firmware (`LG-N01`)

This directory contains the production-ready C++ embedded firmware for the **LANDGUARD AI physical slope monitoring sensor node**.

---

## 🔌 Hardware Bill of Materials (BOM)

| Component | Interface | Model / Part | Role |
|---|---|---|---|
| **Microcontroller** | System Host | ESP32-WROOM-32 | Multi-tasking MCU, ADC sampling & LoRa SPI host |
| **Soil Moisture Sensor** | Analog ADC | Capacitive V2.0 (Corrosion-resistant) | Sub-surface volumetric water content (VWC) |
| **6-DOF IMU** | I²C (0x68) | MPU6050 (GY-521) | 3D slope inclination dip ($\beta$) & creep rate ($\Delta\beta/\Delta t$) |
| **Rain Gauge Transducer** | Analog + Digital | FC-37 / YL-83 Rain Board | Surface storm precipitation intensity |
| **LoRa RF Transceiver** | SPI | Semtech SX1278 (433 MHz) | Long-range low-power telemetry transmission |
| **Power Supply** | Voltage Divider | 18650 Li-ion 3.7V / 2500mAh + TP4056 | Portable field power with voltage monitoring |

---

## 📌 Pinout & Wiring Interconnect Matrix

```
                          ESP32 DEV MODULE (38-PIN)
                              ┌───────────────┐
             3.3V Power ──────┤ 3V3       GND ├────── Common Ground
                              │               │
        Soil Moisture (AOUT) ─┤ GPIO34  GPIO23├────── LoRa MOSI
          Rain Sensor (AOUT) ─┤ GPIO35  GPIO22├────── MPU6050 SCL (I2C)
        Battery Divider (Vout)┤ GPIO36  GPIO21├────── MPU6050 SDA (I2C)
          Rain Sensor (DOUT) ─┤ GPIO14  GPIO19├────── LoRa MISO
                              │         GPIO18├────── LoRa SCK
            LoRa NSS / CS ────┤ GPIO5    GPIO4├────── LoRa DIO0
            LoRa Reset ───────┤ GPIO16   GPIO2├────── Onboard Status LED
                              └───────────────┘
```

### Detailed Pin Connections:

#### 1. Capacitive Soil Moisture Sensor V2.0
- `VCC` $\to$ `ESP32 3V3`
- `GND` $\to$ `ESP32 GND`
- `AOUT` $\to$ `ESP32 GPIO34` (ADC1 Channel 6)

#### 2. MPU6050 6-Axis IMU (GY-521)
- `VCC` $\to$ `ESP32 3V3`
- `GND` $\to$ `ESP32 GND`
- `SCL` $\to$ `ESP32 GPIO22` (I2C SCL)
- `SDA` $\to$ `ESP32 GPIO21` (I2C SDA)
- `AD0` $\to$ `GND` (Sets I2C Address to `0x68`)

#### 3. FC-37 / YL-83 Rain Sensor Board
- `VCC` $\to$ `ESP32 3V3`
- `GND` $\to$ `ESP32 GND`
- `AOUT` $\to$ `ESP32 GPIO35` (ADC1 Channel 7)
- `DOUT` $\to$ `ESP32 GPIO14` (Active LOW rain trigger)

#### 4. Semtech SX1278 LoRa Transceiver (SPI)
- `VCC` $\to$ `ESP32 3V3` *(Requires stable 3.3V with 100µF decoupling capacitor)*
- `GND` $\to$ `ESP32 GND`
- `SCK` $\to$ `ESP32 GPIO18`
- `MISO` $\to$ `ESP32 GPIO19`
- `MOSI` $\to$ `ESP32 GPIO23`
- `NSS (CS)` $\to$ `ESP32 GPIO5`
- `RST` $\to$ `ESP32 GPIO16`
- `DIO0` $\to$ `ESP32 GPIO4`

#### 5. Battery Voltage Divider
- `Li-ion Battery (+)` $\to$ `100kΩ Resistor (R1)` $\to$ `GPIO36 (ADC1_CH0)` $\to$ `100kΩ Resistor (R2)` $\to$ `GND`

---

## 🛠️ Calibration Procedure

### 1. Capacitive Soil Moisture Sensor:
1. Hold sensor in dry ambient air. Note raw ADC reading in Serial Monitor (default: ~`3200`). Update `CALIB_SOIL_ADC_AIR` in `include/config.h`.
2. Submerge sensor up to the white line in a cup of water. Note raw ADC reading (default: ~`1100`). Update `CALIB_SOIL_ADC_WATER` in `include/config.h`.

### 2. MPU6050 Slope Orientation:
- Mount the sensor node securely to the slope casing or test rig.
- The firmware calculates resultant 3D dip angle $\beta$ directly from the static gravitational acceleration vector $\vec{g} = [a_x, a_y, a_z]$:
  $$\beta = \arccos\left(\frac{a_z}{\sqrt{a_x^2 + a_y^2 + a_z^2}}\right)$$

---

## 🚀 Flashing & Compilation

### Option A: Using PlatformIO (Recommended)
```bash
cd firmware/sensor-node
pio run --target upload --environment esp32dev
pio device monitor --baud 115200
```

### Option B: Using Arduino IDE
1. Open `src/sensor_node.ino` in Arduino IDE.
2. Install required libraries via Library Manager:
   - `LoRa` by Sandeep Mistry
   - `Adafruit MPU6050` & `Adafruit Unified Sensor`
   - `ArduinoJson` by Benoit Blanchon
3. Select Board: **ESP32 Dev Module**
4. Click **Upload** (Upload Speed: 921600, Baud: 115200).
