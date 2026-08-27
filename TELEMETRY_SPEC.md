# LANDGUARD AI — Telemetry Specification

> **Version**: 1.0 · **Schema Version Field**: `"1.0"` · **Status**: Prototype

---

## 1. Overview

This document defines the JSON telemetry payload sent from the ESP32 sensor
node (via the LoRa gateway) to the FastAPI backend. This is the **single
contract** that both the real hardware and mock data generator must satisfy.

---

## 2. Telemetry Payload Schema

### 2.1 Full JSON Example

```json
{
  "schema_version": "1.0",
  "node_id": "node-01",
  "timestamp": "2026-08-26T06:15:30Z",
  "seq_num": 1420,
  "sensors": {
    "soil_moisture": {
      "raw": 2048,
      "pct": 42.5
    },
    "accelerometer": {
      "x_g": 0.12,
      "y_g": -0.03,
      "z_g": 0.98
    },
    "gyroscope": {
      "x_dps": 0.5,
      "y_dps": -0.2,
      "z_dps": 0.1
    },
    "tilt": {
      "angle_deg": 22.4
    },
    "rain": {
      "analog_raw": 3200,
      "intensity_pct": 35.0,
      "detected": true
    }
  },
  "battery": {
    "voltage_mv": 3820,
    "level_pct": 85
  },
  "network": {
    "rssi_dbm": -82,
    "snr_db": 9.5
  }
}
```

### 2.2 Field Definitions

#### Top-Level Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `schema_version` | string | ✅ | Schema version, currently `"1.0"` |
| `node_id` | string | ✅ | Unique sensor node identifier, e.g. `"node-01"` |
| `timestamp` | string (ISO 8601) | ✅ | Sensor-side timestamp in UTC |
| `seq_num` | integer | ✅ | Monotonically increasing packet sequence number |
| `sensors` | object | ✅ | Sensor readings (see below) |
| `battery` | object | ❌ | Battery status (optional, nullable) |
| `network` | object | ❌ | LoRa link quality (added by gateway, optional) |

#### `sensors.soil_moisture`

| Field | Type | Required | Range | Unit | Description |
|---|---|---|---|---|---|
| `raw` | integer | ✅ | 0–4095 | ADC counts | Raw 12-bit ADC value |
| `pct` | float | ✅ | 0.0–100.0 | % | Calibrated moisture percentage |

**Calibration**: Linear mapping from `[AIR_VALUE, WATER_VALUE]` → `[0, 100]`.
Calibration constants stored in `config.h` on the sensor node.

#### `sensors.accelerometer`

| Field | Type | Required | Range | Unit | Description |
|---|---|---|---|---|---|
| `x_g` | float | ✅ | ±16.0 | g | X-axis acceleration |
| `y_g` | float | ✅ | ±16.0 | g | Y-axis acceleration |
| `z_g` | float | ✅ | ±16.0 | g | Z-axis acceleration |

**Sensor**: MPU6050, ±2g/±4g/±8g/±16g selectable. Default: ±2g for tilt accuracy.

#### `sensors.gyroscope`

| Field | Type | Required | Range | Unit | Description |
|---|---|---|---|---|---|
| `x_dps` | float | ✅ | ±2000.0 | °/s | X-axis angular velocity |
| `y_dps` | float | ✅ | ±2000.0 | °/s | Y-axis angular velocity |
| `z_dps` | float | ✅ | ±2000.0 | °/s | Z-axis angular velocity |

**Sensor**: MPU6050. Default range: ±250 °/s for precision.

#### `sensors.tilt`

| Field | Type | Required | Range | Unit | Description |
|---|---|---|---|---|---|
| `angle_deg` | float | ✅ | 0.0–90.0 | degrees | Computed tilt angle from vertical |

**Computation**: `atan2(sqrt(ax² + ay²), az) × 180/π` — computed on ESP32.

#### `sensors.rain`

| Field | Type | Required | Range | Unit | Description |
|---|---|---|---|---|---|
| `analog_raw` | integer | ✅ | 0–4095 | ADC counts | Raw rain sensor ADC (higher = drier) |
| `intensity_pct` | float | ✅ | 0.0–100.0 | % | Calibrated rain intensity (0=dry, 100=heavy) |
| `detected` | boolean | ✅ | — | — | Digital output: rain detected above threshold |

**Note**: FC-37 analog output is **inversely proportional** to wetness.
The firmware inverts and scales to produce `intensity_pct`.

#### `battery` (Optional)

| Field | Type | Required | Range | Unit | Description |
|---|---|---|---|---|---|
| `voltage_mv` | integer | ✅ | 0–5000 | mV | Battery voltage |
| `level_pct` | integer | ✅ | 0–100 | % | Estimated battery level |

#### `network` (Optional, added by gateway)

| Field | Type | Required | Range | Unit | Description |
|---|---|---|---|---|---|
| `rssi_dbm` | integer | ✅ | -120–0 | dBm | LoRa received signal strength |
| `snr_db` | float | ✅ | -20–15 | dB | LoRa signal-to-noise ratio |

---

## 3. Pydantic Schema (Backend)

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SoilMoisture(BaseModel):
    raw: int = Field(ge=0, le=4095, description="Raw 12-bit ADC value")
    pct: float = Field(ge=0, le=100, description="Calibrated moisture %")


class Accelerometer(BaseModel):
    x_g: float = Field(ge=-16, le=16, description="X-axis acceleration (g)")
    y_g: float = Field(ge=-16, le=16, description="Y-axis acceleration (g)")
    z_g: float = Field(ge=-16, le=16, description="Z-axis acceleration (g)")


class Gyroscope(BaseModel):
    x_dps: float = Field(ge=-2000, le=2000, description="X angular velocity (°/s)")
    y_dps: float = Field(ge=-2000, le=2000, description="Y angular velocity (°/s)")
    z_dps: float = Field(ge=-2000, le=2000, description="Z angular velocity (°/s)")


class Tilt(BaseModel):
    angle_deg: float = Field(ge=0, le=90, description="Tilt angle from vertical (°)")


class Rain(BaseModel):
    analog_raw: int = Field(ge=0, le=4095, description="Raw rain ADC value")
    intensity_pct: float = Field(ge=0, le=100, description="Rain intensity %")
    detected: bool = Field(description="Rain detected (digital threshold)")


class Sensors(BaseModel):
    soil_moisture: SoilMoisture
    accelerometer: Accelerometer
    gyroscope: Gyroscope
    tilt: Tilt
    rain: Rain


class Battery(BaseModel):
    voltage_mv: int = Field(ge=0, le=5000, description="Battery voltage (mV)")
    level_pct: int = Field(ge=0, le=100, description="Battery level %")


class Network(BaseModel):
    rssi_dbm: int = Field(ge=-120, le=0, description="LoRa RSSI (dBm)")
    snr_db: float = Field(ge=-20, le=15, description="LoRa SNR (dB)")


class TelemetryPayload(BaseModel):
    schema_version: str = Field(default="1.0", description="Schema version")
    node_id: str = Field(min_length=1, max_length=32, description="Node identifier")
    timestamp: datetime = Field(description="Sensor-side UTC timestamp")
    seq_num: int = Field(ge=0, description="Packet sequence number")
    sensors: Sensors
    battery: Optional[Battery] = None
    network: Optional[Network] = None
```

---

## 4. TypeScript Interface (Frontend)

```typescript
interface TelemetryPayload {
  schema_version: string;
  node_id: string;
  timestamp: string;  // ISO 8601
  seq_num: number;
  sensors: {
    soil_moisture: { raw: number; pct: number };
    accelerometer: { x_g: number; y_g: number; z_g: number };
    gyroscope: { x_dps: number; y_dps: number; z_dps: number };
    tilt: { angle_deg: number };
    rain: { analog_raw: number; intensity_pct: number; detected: boolean };
  };
  battery?: { voltage_mv: number; level_pct: number };
  network?: { rssi_dbm: number; snr_db: number };
}
```

---

## 5. LoRa Packet Format

### 5.1 Over-the-Air

The sensor node transmits the telemetry JSON as a **raw LoRa packet**
(not LoRaWAN). The JSON is serialized with no whitespace (`serializeJson`
with compact mode in ArduinoJson).

```
┌──────────────────────────────┐
│  LoRa Physical Frame         │
│  ┌────────────────────────┐  │
│  │  Preamble (8 symbols)  │  │
│  │  Header (explicit)     │  │
│  │  Payload: UTF-8 JSON   │  │  ← ~180-220 bytes
│  │  CRC16                 │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 5.2 LoRa Parameters

| Parameter | Value | Rationale |
|---|---|---|
| Frequency | 433.0 MHz | ISM band legal in India |
| Spreading Factor | SF7 | Fastest data rate, sufficient for short range |
| Bandwidth | 125 kHz | Standard |
| Coding Rate | 4/5 | Minimum error correction |
| TX Power | 17 dBm | Good range for indoor/outdoor demo |
| CRC | Enabled | Packet integrity |
| Sync Word | 0x12 | Private network (not LoRaWAN 0x34) |

### 5.3 Payload Size Budget

| Field | Approximate Bytes |
|---|---|
| Fixed keys + structure | ~120 |
| Sensor values | ~60 |
| Battery + network | ~40 |
| **Total** | **~220 bytes** |

With SF7/BW125, max payload is 255 bytes — we have margin.

### 5.4 Gateway Processing

The gateway:
1. Receives raw LoRa bytes
2. Converts to `String` (UTF-8)
3. Parses JSON to validate `node_id` field exists
4. Attaches `network` object (`rssi_dbm`, `snr_db`) from LoRa radio metadata
5. POSTs the enriched JSON to backend

---

## 6. Sensor Calibration Notes

### 6.1 Capacitive Soil Moisture V2.0

```c
// config.h
#define MOISTURE_AIR_VALUE    3200   // ADC reading in dry air
#define MOISTURE_WATER_VALUE  1400   // ADC reading submerged in water

// Calibration formula:
// pct = (AIR - raw) / (AIR - WATER) × 100
// Clamped to [0, 100]
```

**Recommendation**: Calibrate `AIR_VALUE` and `WATER_VALUE` for each
individual sensor unit before demo.

### 6.2 MPU6050 Tilt

```c
// Tilt from vertical:
// angle = atan2(sqrt(ax*ax + ay*ay), az) * 180.0 / PI
// Mount sensor so Z-axis is perpendicular to slope surface
```

**Drift mitigation**: Read 100 samples at startup, compute mean offset,
subtract from subsequent readings.

### 6.3 FC-37 Rain Sensor

```c
// config.h
#define RAIN_DRY_VALUE   4095  // No rain (max analog)
#define RAIN_WET_VALUE   1000  // Heavy rain (low analog)
#define RAIN_DIGITAL_PIN 25    // Digital out (LOW = rain detected)

// intensity_pct = (DRY - raw) / (DRY - WET) × 100
// Clamped to [0, 100]
```

---

## 7. Schema Versioning

The `schema_version` field allows forward-compatible schema evolution:

| Version | Changes |
|---|---|
| `"1.0"` | Initial prototype schema (current) |
| `"1.1"` (future) | Add pore-pressure sensor fields |
| `"2.0"` (future) | Binary/CBOR encoding, multi-sensor arrays |

Backend validates `schema_version` and rejects unknown versions with
HTTP 422 and a descriptive error message.
