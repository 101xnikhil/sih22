# LANDGUARD AI — System Architecture

> **Status**: Prototype (SIH 2026) · Single sensor node · Local-only operation
>
> **⚠️ Disclaimer**: This is a 10-day prototype. All risk scores, Factor-of-Safety
> estimates, and alerts are **simulation/demonstration only** and must NOT be
> used for real-world landslide prediction or evacuation decisions.

---

## 1. High-Level Pipeline

```
┌──────────────┐    LoRa 433 MHz     ┌──────────────┐    Wi-Fi / Serial
│  SENSOR NODE │ ──────────────────▶  │   GATEWAY    │ ──────────────────▶
│   (ESP32)    │   point-to-point    │   (ESP32)    │   HTTP POST
└──────────────┘                     └──────────────┘
       │                                    │
       │ Sensors:                           │
       │  • Capacitive Soil Moisture V2.0   │
       │  • MPU6050 (accel + gyro)          │
       │  • FC-37 Rain Sensor              │
       │                                    ▼
                                    ┌──────────────────────────────────────┐
                                    │         LAPTOP / LOCAL SERVER        │
                                    │                                      │
                                    │  ┌────────────┐   ┌───────────────┐  │
                                    │  │  FastAPI    │◀─▶│  SQLite DB    │  │
                                    │  │  Backend    │   │  (readings +  │  │
                                    │  │            │   │   alerts)     │  │
                                    │  └─────┬──────┘   └───────────────┘  │
                                    │        │                             │
                                    │        ▼                             │
                                    │  ┌────────────────────────┐         │
                                    │  │   Risk Engine          │         │
                                    │  │  • Physics features    │         │
                                    │  │  • FoS estimator       │         │
                                    │  │  • XGBoost model       │         │
                                    │  │  • SHAP explainer      │         │
                                    │  └─────┬──────────────────┘         │
                                    │        │                             │
                                    │        ▼                             │
                                    │  ┌────────────────────────┐         │
                                    │  │   React Dashboard      │         │
                                    │  │  • Real-time gauges    │         │
                                    │  │  • Time-series charts  │         │
                                    │  │  • Risk level display  │         │
                                    │  │  • SHAP explanations   │         │
                                    │  │  • Alert history       │         │
                                    │  └────────────────────────┘         │
                                    └──────────────────────────────────────┘
```

---

## 2. Directory Structure

```
landguard-ai/
│
├── README.md
├── ARCHITECTURE.md            ← you are here
├── API_SPEC.md
├── TELEMETRY_SPEC.md
├── DEVELOPMENT_PLAN.md
├── .gitignore
│
├── firmware/
│   ├── sensor_node/
│   │   ├── platformio.ini
│   │   ├── src/
│   │   │   └── main.cpp       ← ESP32 sensor node firmware
│   │   ├── lib/
│   │   │   ├── sensors/       ← sensor abstraction (moisture, MPU, rain)
│   │   │   ├── lora/          ← LoRa TX wrapper
│   │   │   └── telemetry/     ← JSON serialization + packet framing
│   │   └── include/
│   │       └── config.h       ← pin assignments, LoRa freq, node ID
│   │
│   └── gateway/
│       ├── platformio.ini
│       ├── src/
│       │   └── main.cpp       ← ESP32 gateway firmware
│       ├── lib/
│       │   ├── lora/          ← LoRa RX wrapper
│       │   └── uplink/        ← Wi-Fi HTTP POST or Serial forwarder
│       └── include/
│           └── config.h       ← Wi-Fi creds, backend URL, LoRa freq
│
├── backend/
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── alembic.ini            ← DB migrations
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            ← FastAPI app factory, lifespan
│   │   ├── config.py          ← pydantic-settings based config
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── ingest.py      ← POST /api/v1/telemetry (from gateway)
│   │   │   ├── readings.py    ← GET  /api/v1/readings  (history)
│   │   │   ├── risk.py        ← GET  /api/v1/risk      (current risk)
│   │   │   ├── alerts.py      ← GET  /api/v1/alerts    (alert history)
│   │   │   └── health.py      ← GET  /api/v1/health
│   │   │
│   │   ├── ws/
│   │   │   ├── __init__.py
│   │   │   └── live.py        ← WebSocket /ws/live
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── reading.py     ← SQLAlchemy ORM: SensorReading
│   │   │   ├── alert.py       ← SQLAlchemy ORM: Alert
│   │   │   └── risk.py        ← SQLAlchemy ORM: RiskAssessment
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── telemetry.py   ← Pydantic: TelemetryPayload
│   │   │   ├── reading.py     ← Pydantic: ReadingResponse
│   │   │   ├── risk.py        ← Pydantic: RiskResponse
│   │   │   └── alert.py       ← Pydantic: AlertResponse
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ingestion.py   ← validate + store + trigger pipeline
│   │   │   └── alerting.py    ← threshold checks, alert creation
│   │   │
│   │   └── db/
│   │       ├── __init__.py
│   │       ├── session.py     ← async SQLAlchemy session factory
│   │       └── base.py        ← declarative base
│   │
│   ├── risk_engine/
│   │   ├── __init__.py
│   │   ├── features.py        ← physics-derived feature engineering
│   │   ├── fos.py             ← simplified Factor of Safety calculator
│   │   ├── model.py           ← XGBoost wrapper: train / predict
│   │   ├── explainer.py       ← SHAP explanation generator
│   │   ├── pipeline.py        ← orchestrate: features → model → SHAP
│   │   └── artifacts/
│   │       ├── model.json     ← trained XGBoost model (checked in for demo)
│   │       └── scaler.pkl     ← feature scaler
│   │
│   ├── mock/
│   │   ├── __init__.py
│   │   ├── generator.py       ← synthetic telemetry generator
│   │   ├── scenarios.py       ← pre-built scenarios (dry, rain, crisis)
│   │   └── feeder.py          ← POST synthetic data to /api/v1/telemetry
│   │
│   └── tests/
│       ├── conftest.py
│       ├── test_ingest.py
│       ├── test_risk_engine.py
│       └── test_ws.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   │
│   ├── public/
│   │   └── favicon.ico
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       │
│       ├── api/
│       │   ├── client.ts       ← axios / fetch wrapper
│       │   └── websocket.ts    ← WebSocket hook
│       │
│       ├── components/
│       │   ├── Dashboard.tsx       ← main layout
│       │   ├── RiskGauge.tsx       ← current risk level gauge
│       │   ├── SensorCards.tsx     ← live sensor values
│       │   ├── TimeSeriesChart.tsx ← recharts time-series
│       │   ├── ShapChart.tsx       ← SHAP waterfall / bar chart
│       │   ├── AlertBanner.tsx     ← real-time alert banner
│       │   ├── AlertHistory.tsx    ← past alerts table
│       │   └── PrototypeLabel.tsx  ← "PROTOTYPE — NOT FOR REAL USE" badge
│       │
│       ├── hooks/
│       │   ├── useLiveData.ts     ← WebSocket state management
│       │   └── useReadings.ts     ← REST polling / react-query
│       │
│       ├── types/
│       │   └── index.ts           ← TypeScript interfaces matching API
│       │
│       └── utils/
│           └── formatters.ts      ← unit labels, date formatting
│
├── scripts/
│   ├── run_mock.sh             ← start backend + feed mock data
│   ├── train_model.py          ← train XGBoost on synthetic dataset
│   └── generate_dataset.py     ← generate synthetic CSV for training
│
├── data/
│   ├── synthetic_train.csv     ← generated training data
│   └── README.md               ← data provenance notes
│
└── docs/
    ├── wiring_diagram.md       ← ESP32 pin connections
    ├── lora_protocol.md        ← LoRa packet format
    └── setup_guide.md          ← how to run everything
```

---

## 3. Component Architecture

### 3.1 Sensor Node (ESP32 #1)

**Responsibility**: Read sensors at a fixed interval, pack telemetry JSON,
transmit over LoRa.

| Sensor | Interface | Measurement | Unit |
|---|---|---|---|
| Capacitive Soil Moisture V2.0 | Analog (ADC) | Volumetric water content proxy | 0–100 % (calibrated) |
| MPU6050 / GY-521 | I²C | 3-axis acceleration + 3-axis gyro | g / °/s → tilt ° |
| FC-37 / YL-83 Rain Sensor | Analog (ADC) + Digital | Rain intensity proxy | 0–100 % (analog) / bool (digital) |

**Cycle**:
1. Wake / loop tick (configurable, default **10 s**)
2. Read all sensors
3. Compute tilt angle from accelerometer (`atan2(ax, az) × 180/π`)
4. Pack JSON payload (see `TELEMETRY_SPEC.md`)
5. Transmit via LoRa (433 MHz, SF7, BW 125 kHz)
6. Sleep / wait for next tick

**Key config** (`config.h`):
- `NODE_ID` — unique string, e.g. `"node-01"`
- `TX_INTERVAL_MS` — telemetry interval (default 10000)
- `LORA_FREQ` — 433.0 MHz (ISM band, India)
- Pin assignments for each sensor

### 3.2 Gateway (ESP32 #2)

**Responsibility**: Receive LoRa packets, forward to backend over Wi-Fi.

**Cycle**:
1. Listen for LoRa packets
2. Validate packet (JSON parse, check `node_id` field)
3. HTTP POST to `http://<BACKEND_IP>:8000/api/v1/telemetry`
4. On POST failure: buffer up to 50 packets in RAM, retry next cycle
5. Optionally echo to Serial for debugging

**Key config** (`config.h`):
- `WIFI_SSID`, `WIFI_PASS`
- `BACKEND_URL`
- `LORA_FREQ` — must match sensor node

### 3.3 Backend (FastAPI)

**Responsibility**: Ingest telemetry, persist to DB, run risk engine, serve
REST + WebSocket APIs.

**Stack**:
- Python 3.11+
- FastAPI + Uvicorn
- SQLAlchemy 2.0 (async) + aiosqlite
- SQLite (file-based, zero-config, local-first)
- Alembic for migrations

**Request flow** (on each incoming telemetry POST):
```
Gateway POST /api/v1/telemetry
    │
    ▼
Pydantic validation (TelemetryPayload)
    │
    ▼
Store SensorReading row
    │
    ▼
Risk Engine pipeline (sync, fast)
    ├── Feature engineering (physics-derived)
    ├── FoS computation
    ├── XGBoost prediction (~1-2 ms)
    ├── SHAP explanation (conditional — on threshold or every Nth reading)
    └── Store RiskAssessment row
    │
    ▼
Alerting service
    ├── Check risk thresholds
    └── If triggered → store Alert row
    │
    ▼
Broadcast via WebSocket /ws/live
    ├── latest reading
    ├── risk score + level + SHAP values
    └── alert (if any)
```

### 3.4 Risk Engine

**Approach**: Gray-box / physics-informed.

#### 3.4.1 Physics-Derived Features

From raw sensor data, compute:

| Feature | Formula / Source | Purpose |
|---|---|---|
| `soil_moisture_pct` | Calibrated from ADC | Proxy for pore-water saturation |
| `tilt_angle_deg` | `atan2(ax, az) × 180/π` from MPU6050 | Slope angle |
| `tilt_rate_deg_per_min` | `Δtilt / Δtime` (rolling window) | Creep detection |
| `rain_intensity_pct` | Calibrated from FC-37 analog | Rainfall proxy |
| `cumulative_rain_1h` | Rolling sum of rain over 60 min | Antecedent rainfall |
| `fos_estimate` | Infinite slope model (simplified) | Stability indicator |
| `moisture_rain_interaction` | `soil_moisture × rain_intensity` | Combined saturation signal |

#### 3.4.2 Simplified Factor of Safety (FoS)

Using the **infinite slope model** (Skempton & DeLory, simplified):

```
FoS = (c' + (γ_sat - γ_w) × z × cos²(β) × tan(φ')) / (γ_sat × z × sin(β) × cos(β))
```

Where:
- `c'` = effective cohesion (configurable, default 5 kPa)
- `γ_sat` = saturated unit weight (18 kN/m³)
- `γ_w` = unit weight of water (9.81 kN/m³)
- `z` = depth of failure surface (configurable, default 1.5 m)
- `β` = slope angle (from tilt sensor, degrees)
- `φ'` = effective friction angle (configurable, default 25°)

**Moisture effect**: `c'` and `tan(φ')` are linearly reduced as
`soil_moisture_pct` increases from 0→100%, simulating loss of cohesion and
friction with saturation. At 100% moisture, both are reduced to 60% of their
dry values.

> **⚠️ Prototype Approximation**: Real FoS calculations require geotechnical
> site investigation, proper soil parameters, lab-tested shear strengths, and
> validated groundwater models. This simplified model is for **demonstration
> and teaching purposes only**.

#### 3.4.3 XGBoost Model

- **Input**: 7 engineered features (above)
- **Output**: Risk score 0.0–1.0 (probability of instability)
- **Training data**: Synthetic (see §5 Mock Data)
- **Hyperparameters**: Tuned on synthetic data, stored in `model.json`
- **Startup**: Model + SHAP TreeExplainer pre-loaded during FastAPI lifespan init

#### 3.4.4 SHAP Explainer

- `shap.TreeExplainer` for XGBoost (fast, exact for tree models)
- Pre-initialized at startup (avoid per-request overhead)
- Returns per-feature SHAP values for each prediction
- Serialized as sorted contribution list for frontend rendering

#### 3.4.5 Risk Levels

| Risk Score | Level | Color | FoS Range | Action |
|---|---|---|---|---|
| 0.00 – 0.25 | LOW | 🟢 Green | > 1.5 | Normal monitoring |
| 0.25 – 0.50 | MODERATE | 🟡 Yellow | 1.3 – 1.5 | Increased attention |
| 0.50 – 0.75 | HIGH | 🟠 Orange | 1.0 – 1.3 | Alert issued |
| 0.75 – 1.00 | CRITICAL | 🔴 Red | < 1.0 | Evacuation warning |

### 3.5 Database (SQLite)

See §6 for full schema. Three core tables:

- **`sensor_readings`** — raw + calibrated sensor values, one row per telemetry packet
- **`risk_assessments`** — risk score, level, FoS, SHAP values, linked to reading
- **`alerts`** — triggered alerts with severity and message

**SQLite configuration** (critical for concurrent read/write):
```sql
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

**Why SQLite?**
- Zero configuration, single file, perfect for offline local prototype
- Async access via aiosqlite
- Easy to swap to PostgreSQL/TimescaleDB later (SQLAlchemy ORM abstracts the dialect)

### 3.6 Frontend (React + TypeScript)

**Stack**:
- React 18 + TypeScript
- Vite (build tool)
- Recharts (time-series charts)
- WebSocket (native browser API via custom hook with reconnect)
- TailwindCSS (styling)

**Key views**:
1. **Dashboard** — single-page layout with all widgets
2. **Risk Gauge** — large circular gauge showing current risk level + color
3. **Sensor Cards** — live values for moisture, tilt, rain with units
4. **Time-Series** — scrolling chart of sensor values over time (last 1h)
5. **SHAP Chart** — horizontal bar chart showing feature contributions to risk
6. **Alert Banner** — top-of-page banner when risk ≥ HIGH
7. **Alert History** — scrollable table of past alerts

**Prototype Label**: Every page shows a persistent badge:
> ⚠️ PROTOTYPE — Synthetic/Demo Data — NOT for real-world decisions

**Data loading pattern**: On mount, REST fetch historical baseline → open WebSocket for real-time deltas.

---

## 4. Interface Contracts

### 4.1 Sensor Node → Gateway (LoRa)

- **Transport**: LoRa 433 MHz, point-to-point, SF7, BW 125 kHz
- **Payload**: JSON string (compact, no whitespace)
- **Max size**: ~200 bytes (well within LoRa SF7 limit of 255 bytes)
- **Framing**: Raw LoRa packet, no additional framing
- **Integrity**: LoRa CRC enabled

### 4.2 Gateway → Backend

- **Transport**: HTTP POST over Wi-Fi (local network)
- **Endpoint**: `POST /api/v1/telemetry`
- **Content-Type**: `application/json`
- **Payload**: `TelemetryPayload` (see `TELEMETRY_SPEC.md`)
- **Auth**: None for prototype (future: API key in `X-API-Key` header)
- **Retry**: Gateway retries on HTTP failure, buffers up to 50 packets

### 4.3 Backend → Frontend (REST)

- **Base URL**: `http://localhost:8000/api/v1`
- **Format**: JSON
- **Endpoints**: See `API_SPEC.md`

### 4.4 Backend → Frontend (WebSocket)

- **URL**: `ws://localhost:8000/ws/live`
- **Direction**: Server → Client (server push, client can send ping/subscribe)
- **Format**: JSON events with `type` field (see `API_SPEC.md`)
- **Reconnect**: Client implements exponential backoff reconnect

### 4.5 Risk Engine (Internal Python Interface)

```python
@dataclass
class RiskResult:
    risk_score: float            # 0.0–1.0
    risk_level: str              # LOW | MODERATE | HIGH | CRITICAL
    fos_estimate: float          # Factor of Safety value
    features: dict[str, float]   # engineered feature name → value
    shap_values: dict[str, float]  # feature name → SHAP contribution
    base_value: float            # SHAP base value (expected value)
    timestamp: datetime

# Usage:
result = risk_pipeline.evaluate(telemetry_payload, recent_readings)
```

---

## 5. Mock Data Strategy

### 5.1 Synthetic Telemetry Generator

`backend/mock/generator.py` produces telemetry payloads that simulate
realistic sensor behavior across scenarios:

| Scenario | Moisture | Rain | Tilt | FoS | Risk |
|---|---|---|---|---|---|
| `dry_stable` | 15–25% | 0–5% | stable 20° | > 1.5 | LOW |
| `moderate_rain` | 35–55% | 20–40% | stable 22° | 1.2–1.5 | MODERATE |
| `heavy_rain` | 60–80% | 50–80% | slight drift +0.1°/hr | 1.0–1.3 | HIGH |
| `crisis` | 85–98% | 80–100% | accelerating +0.5°/hr | < 1.0 | CRITICAL |

Scenarios produce **time-series sequences** with:
- Smooth transitions between states
- Gaussian noise on each reading
- Realistic temporal autocorrelation
- Configurable duration and transition timing

### 5.2 Mock Feeder

```bash
# Start the mock data feeder
python -m backend.mock.feeder --scenario heavy_rain --interval 10

# Run a full escalating sequence (dry → crisis over 30 min)
python -m backend.mock.feeder --scenario escalation --interval 5
```

The feeder POSTs to `POST /api/v1/telemetry` — identical to what the
real gateway does.

### 5.3 Transition to Real ESP32 Sensors

The backend **does not know or care** whether data comes from the mock feeder
or a real ESP32 gateway. Both POST identical JSON to the same endpoint.

**Cutover steps**:
1. Flash firmware to sensor node and gateway ESPs
2. Power on hardware, verify Serial output
3. Stop mock feeder (`Ctrl+C`)
4. Gateway automatically POSTs to the same `/api/v1/telemetry` endpoint
5. Dashboard shows real sensor data — **no backend or frontend changes needed**

The `TelemetryPayload` schema is the single contract that both mock and real
data must satisfy.

---

## 6. Database Schema

### 6.1 `sensor_readings`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `node_id` | TEXT NOT NULL | Sensor node identifier |
| `timestamp` | DATETIME NOT NULL | Sensor-side timestamp (UTC) |
| `received_at` | DATETIME NOT NULL | Server reception time (UTC) |
| `soil_moisture_raw` | INTEGER | Raw ADC value (0–4095) |
| `soil_moisture_pct` | REAL | Calibrated moisture (0–100%) |
| `accel_x` | REAL | Accelerometer X (g) |
| `accel_y` | REAL | Accelerometer Y (g) |
| `accel_z` | REAL | Accelerometer Z (g) |
| `gyro_x` | REAL | Gyroscope X (°/s) |
| `gyro_y` | REAL | Gyroscope Y (°/s) |
| `gyro_z` | REAL | Gyroscope Z (°/s) |
| `tilt_angle_deg` | REAL | Computed tilt angle (°) |
| `rain_analog` | INTEGER | Raw rain ADC (0–4095) |
| `rain_intensity_pct` | REAL | Calibrated rain intensity (0–100%) |
| `rain_detected` | BOOLEAN | Digital rain threshold |
| `battery_mv` | INTEGER NULL | Battery voltage (mV), optional |
| `rssi_dbm` | INTEGER NULL | LoRa RSSI at gateway (dBm) |
| `snr_db` | REAL NULL | LoRa SNR at gateway (dB) |
| `seq_num` | INTEGER NULL | Packet sequence number |

**Index**: `(node_id, timestamp)` — for time-range queries per node.

### 6.2 `risk_assessments`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `reading_id` | INTEGER FK → sensor_readings.id | Source reading |
| `timestamp` | DATETIME NOT NULL | Assessment time (UTC) |
| `risk_score` | REAL NOT NULL | 0.0–1.0 |
| `risk_level` | TEXT NOT NULL | LOW / MODERATE / HIGH / CRITICAL |
| `fos_estimate` | REAL | Computed Factor of Safety |
| `features_json` | TEXT | JSON: engineered feature values |
| `shap_values_json` | TEXT | JSON: per-feature SHAP contributions |
| `shap_base_value` | REAL | SHAP expected value |
| `model_version` | TEXT | Model identifier / hash |

**Index**: `(timestamp)` — for time-range queries.

### 6.3 `alerts`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `risk_assessment_id` | INTEGER FK → risk_assessments.id | Triggering assessment |
| `timestamp` | DATETIME NOT NULL | Alert time (UTC) |
| `severity` | TEXT NOT NULL | HIGH / CRITICAL |
| `risk_score` | REAL NOT NULL | Score at time of alert |
| `risk_level` | TEXT NOT NULL | Level at time of alert |
| `message` | TEXT NOT NULL | Human-readable alert message |
| `acknowledged` | BOOLEAN DEFAULT FALSE | User acknowledgment |
| `acknowledged_at` | DATETIME NULL | When acknowledged |

**Index**: `(timestamp)`, `(severity)`.

---

## 7. Deployment Topology (Prototype)

```
┌─────────────────────────────────────────────────┐
│                  LAPTOP                          │
│                                                  │
│   Terminal 1:  uvicorn app.main:app --port 8000  │
│   Terminal 2:  cd frontend && npm run dev        │
│   Terminal 3:  python -m backend.mock.feeder     │
│                (or real gateway connected)        │
│                                                  │
│   Browser:     http://localhost:5173             │
│                                                  │
│   Database:    ./backend/landguard.db (SQLite)   │
└─────────────────────────────────────────────────┘
```

**No Internet required** — everything runs on `localhost`.

---

## 8. Technical Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | LoRa range insufficient indoors | No data at demo | Test early; have Serial USB fallback |
| 2 | ESP32 ADC nonlinearity | Inaccurate moisture readings | Multi-point calibration; document error bounds |
| 3 | SQLite write contention under load | Dropped writes | WAL mode + busy timeout; single writer pattern |
| 4 | XGBoost trained on synthetic data only | Meaningless real-world predictions | Label as PROTOTYPE; don't claim accuracy |
| 5 | MPU6050 drift over time | Tilt angle wanders | Complementary filter; recalibrate at startup |
| 6 | WebSocket disconnects on network hiccup | Dashboard goes stale | Auto-reconnect with exponential backoff |
| 7 | Rain sensor FC-37 poor quantification | Can't measure mm/hr | Use as presence/intensity proxy only; future: tipping bucket |
| 8 | 10-day timeline too tight | Incomplete features | Prioritize end-to-end pipeline over polish |

---

## 9. Future Architecture Extensions

| Extension | Architectural Impact |
|---|---|
| Multiple sensor nodes | Add `node_id` routing in backend; dashboard node selector dropdown |
| LoRaWAN | Replace point-to-point LoRa with LoRaWAN stack + MQTT broker |
| PostgreSQL / TimescaleDB | Change SQLAlchemy connection string; add hypertables for time-series |
| Cloud deployment | Containerize backend + frontend; add HTTPS, JWT auth, cloud DB |
| Better ML models | Swap XGBoost for LSTM/Transformer in `risk_engine/model.py`; retrain on field data |
| GIS/DEM integration | Add spatial data service; Leaflet/Mapbox map in frontend |
| Solar power | Firmware deep-sleep optimization; wake-on-timer |
| Cybersecurity | TLS on LoRaWAN, API key auth, input sanitization, rate limiting |
| Tipping-bucket rain gauge | Replace FC-37 with pulse-counting interrupt; convert to mm/hr |
| Tensiometer/pore-pressure | Add I²C/analog sensor driver; new telemetry fields |
