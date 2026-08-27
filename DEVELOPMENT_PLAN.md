# LANDGUARD AI — Development Plan

> **Timeline**: 10 days · **Team**: SIH 2026 · **Status**: Planning complete, ready for implementation

---

## 1. Guiding Principles

1. **End-to-end first, polish later** — Get the full pipeline working (mock data → dashboard) before optimizing any component.
2. **Mock-first development** — Every layer works with mock/synthetic data from Day 1. Real hardware integration is the final step.
3. **Single contract** — The `TelemetryPayload` JSON schema is the interface between all layers. Backend doesn't care if data is mock or real.
4. **Honest prototyping** — Never claim real-world accuracy. Label everything as PROTOTYPE.
5. **Local-only** — No cloud dependencies. Everything runs on one laptop.

---

## 2. 10-Day Sprint Plan

### Phase 1: Foundation (Days 1–2)

#### Day 1 — Project Scaffolding + Backend Core

- [ ] Initialize git repository, `.gitignore`
- [ ] Create backend project structure (`pyproject.toml`, `requirements.txt`)
- [ ] Set up FastAPI app factory with lifespan
- [ ] Configure SQLAlchemy async + SQLite with WAL mode
- [ ] Create database models (`sensor_readings`, `risk_assessments`, `alerts`)
- [ ] Run Alembic init + first migration
- [ ] Implement Pydantic schemas (`TelemetryPayload`, responses)
- [ ] Implement `POST /api/v1/telemetry` — validate + store reading
- [ ] Implement `GET /api/v1/health`
- [ ] Write basic tests for ingestion endpoint

**Exit criteria**: Can POST a telemetry JSON, see it stored in SQLite, GET health returns 200.

#### Day 2 — Mock Data + Remaining REST Endpoints

- [ ] Build synthetic telemetry generator (`mock/generator.py`)
- [ ] Build scenario engine (`mock/scenarios.py`) — dry, moderate, heavy, crisis
- [ ] Build mock feeder (`mock/feeder.py`) — POSTs to backend at interval
- [ ] Implement `GET /api/v1/readings` (history with filtering)
- [ ] Implement `GET /api/v1/readings/{id}` (single reading detail)
- [ ] Implement `GET /api/v1/alerts` (alert history)
- [ ] Implement `PATCH /api/v1/alerts/{id}/acknowledge`
- [ ] Add CORS middleware

**Exit criteria**: Mock feeder running, database filling up, all REST endpoints returning data.

---

### Phase 2: Risk Engine (Days 3–4)

#### Day 3 — Physics Features + Factor of Safety

- [ ] Implement feature engineering (`risk_engine/features.py`)
  - Soil moisture (pass-through calibrated)
  - Tilt angle (from payload)
  - Tilt rate (rolling Δtilt/Δtime from last N readings)
  - Rain intensity (pass-through)
  - Cumulative rain 1h (rolling sum from DB)
  - Moisture × rain interaction
- [ ] Implement simplified FoS calculator (`risk_engine/fos.py`)
  - Infinite slope model
  - Moisture-dependent cohesion/friction reduction
  - Configurable soil parameters
- [ ] Write unit tests for feature engineering and FoS
- [ ] Generate synthetic training dataset (`scripts/generate_dataset.py`)
  - 10,000+ samples across all scenarios
  - Labels derived from FoS thresholds + noise

**Exit criteria**: Feature engineering + FoS tested and working. Training CSV generated.

#### Day 4 — XGBoost Model + SHAP + Pipeline Integration

- [ ] Train XGBoost model (`scripts/train_model.py`)
  - Train/test split on synthetic data
  - Log accuracy, confusion matrix, feature importance
  - Save model to `risk_engine/artifacts/model.json`
  - Save scaler to `risk_engine/artifacts/scaler.pkl`
- [ ] Implement model wrapper (`risk_engine/model.py`)
  - Load model from artifact
  - Predict risk score
- [ ] Implement SHAP explainer (`risk_engine/explainer.py`)
  - TreeExplainer initialization
  - Per-prediction SHAP values
- [ ] Implement risk pipeline (`risk_engine/pipeline.py`)
  - Orchestrate: raw data → features → FoS → XGBoost → SHAP → RiskResult
- [ ] Integrate pipeline into telemetry ingestion flow
  - On POST /telemetry: store reading → run pipeline → store assessment → check alerts
- [ ] Implement `GET /api/v1/risk` (current risk)
- [ ] Implement `GET /api/v1/risk/history`
- [ ] Write integration tests

**Exit criteria**: POST telemetry → get risk score + SHAP explanation back. Risk stored in DB. Alerts triggered at HIGH/CRITICAL.

---

### Phase 3: Real-Time + Frontend (Days 5–7)

#### Day 5 — WebSocket + Connection Manager

- [ ] Implement ConnectionManager (track clients, broadcast, heartbeat)
- [ ] Implement WebSocket endpoint `/ws/live`
- [ ] Wire ingestion → broadcast pipeline
  - Each POST triggers: `new_reading`, `risk_update`, (optional `alert`)
- [ ] Test WebSocket with `websocat` or Python client
- [ ] Add heartbeat (every 30s)

**Exit criteria**: Connect to WebSocket, see live events as mock feeder runs.

#### Day 6 — React Frontend Scaffolding

- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure TailwindCSS
- [ ] Set up project structure (components, hooks, api, types)
- [ ] Define TypeScript interfaces matching API spec
- [ ] Build API client (fetch wrapper for REST endpoints)
- [ ] Build WebSocket hook (`useLiveData`) with auto-reconnect
- [ ] Build main Dashboard layout (responsive grid)
- [ ] Build PrototypeLabel component (persistent warning badge)
- [ ] Build SensorCards component (moisture, tilt, rain — live values)

**Exit criteria**: Dashboard layout renders. WebSocket connects. Sensor cards show live mock data.

#### Day 7 — Dashboard Visualizations

- [ ] Build RiskGauge component (circular gauge, color-coded)
- [ ] Build TimeSeriesChart component (Recharts, last 1h of readings)
- [ ] Build ShapChart component (horizontal bar chart of feature contributions)
- [ ] Build AlertBanner component (slides in when risk ≥ HIGH)
- [ ] Build AlertHistory component (scrollable table)
- [ ] Wire `useReadings` hook for historical data fetch on mount
- [ ] Polish responsive layout for demo screen
- [ ] Add loading states and error handling

**Exit criteria**: Full dashboard working with mock data — gauges, charts, SHAP, alerts all updating in real-time.

---

### Phase 4: Firmware + Hardware (Days 8–9)

#### Day 8 — ESP32 Firmware

- [ ] Set up PlatformIO projects for sensor node + gateway
- [ ] Sensor node firmware:
  - Read capacitive moisture sensor (ADC)
  - Read MPU6050 via I²C (Wire library)
  - Read FC-37 rain sensor (ADC + digital)
  - Compute tilt angle
  - Serialize JSON with ArduinoJson
  - Transmit via LoRa (RadioLib or LoRa library)
- [ ] Gateway firmware:
  - Receive LoRa packet
  - Parse JSON, validate
  - Attach RSSI/SNR from radio metadata
  - Connect to Wi-Fi
  - HTTP POST to backend (HTTPClient library)
  - Serial debug output
- [ ] Test LoRa TX/RX on bench (two ESPs, no sensors)

**Exit criteria**: Two ESPs communicate over LoRa. Gateway POSTs to backend.

#### Day 9 — Hardware Integration + Calibration

- [ ] Wire sensors to sensor node ESP32
  - Capacitive moisture → GPIO 34 (ADC)
  - MPU6050 → GPIO 21 (SDA), GPIO 22 (SCL)
  - FC-37 → GPIO 35 (analog), GPIO 25 (digital)
  - LoRa SX1278 → SPI (see wiring doc)
- [ ] Calibrate moisture sensor (air vs water readings)
- [ ] Calibrate rain sensor (dry vs wet readings)
- [ ] Verify MPU6050 tilt readings (known angles)
- [ ] Connect sensor node → gateway → backend → dashboard
- [ ] Verify end-to-end: tilt physical sensor → see value on dashboard
- [ ] Document wiring in `docs/wiring_diagram.md`

**Exit criteria**: Physical sensor data flows through entire pipeline to dashboard.

---

### Phase 5: Polish + Demo (Day 10)

#### Day 10 — Integration Testing + Demo Prep

- [ ] End-to-end integration test with real hardware
- [ ] Test scenario: run mock escalation (dry → crisis) — verify dashboard behavior
- [ ] Test scenario: switch from mock to real sensors mid-run
- [ ] Fix any UI layout issues on demo display
- [ ] Add demo mode toggle (mock vs. live) if time permits
- [ ] Write `docs/setup_guide.md` — step-by-step to run everything
- [ ] Write `README.md` — project overview for judges
- [ ] Prepare demo script (what to show, in what order)
- [ ] Final commit, tag `v0.1.0-prototype`

**Exit criteria**: Demo-ready. Can show: mock escalation, real sensor data, risk scoring, SHAP explanation, alerts.

---

## 3. Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Sensor Node | ESP32 + Arduino/PlatformIO | — | Sensor reading + LoRa TX |
| Gateway | ESP32 + Arduino/PlatformIO | — | LoRa RX + Wi-Fi HTTP POST |
| LoRa | SX1276/SX1278 (RadioLib) | — | Point-to-point wireless |
| Backend | Python + FastAPI | 3.11+ / 0.100+ | REST + WebSocket API |
| Database | SQLite + SQLAlchemy 2.0 | — | Async ORM + storage |
| Migrations | Alembic | — | Schema versioning |
| ML Model | XGBoost | 2.0+ | Risk classification |
| Explainability | SHAP | 0.43+ | Feature importance |
| Feature Eng. | NumPy, scikit-learn | — | Physics features, scaling |
| Frontend | React 18 + TypeScript | — | Dashboard UI |
| Build Tool | Vite | 5+ | Fast dev server + build |
| Charts | Recharts | 2.x | Time-series + bar charts |
| Styling | TailwindCSS | 3.x | Utility-first CSS |
| Testing | pytest + pytest-asyncio | — | Backend tests |
| Firmware Build | PlatformIO | — | ESP32 compilation + upload |

---

## 4. Dependency Inventory

### 4.1 Backend (`requirements.txt`)

```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
sqlalchemy[asyncio]>=2.0.0
aiosqlite>=0.19.0
alembic>=1.12.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
xgboost>=2.0.0
shap>=0.43.0
scikit-learn>=1.3.0
numpy>=1.24.0
pandas>=2.0.0
httpx>=0.24.0
pytest>=7.4.0
pytest-asyncio>=0.21.0
```

### 4.2 Frontend (`package.json` dependencies)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.8.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0"
  }
}
```

### 4.3 Firmware (PlatformIO `lib_deps`)

```ini
# sensor_node/platformio.ini
[env:esp32]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    jgromes/RadioLib@^6.0.0
    bblanchon/ArduinoJson@^6.21.0
    adafruit/Adafruit MPU6050@^2.2.0
    adafruit/Adafruit Unified Sensor@^1.1.0
```

---

## 5. Risk Register

| # | Risk | Likelihood | Impact | Mitigation | Contingency |
|---|---|---|---|---|---|
| 1 | LoRa doesn't work indoors at demo | Medium | High | Test early (Day 8); use short range | Use Serial USB connection as fallback |
| 2 | ESP32 ADC noise too high | Medium | Medium | Average multiple samples; add decoupling cap | Document known noise floor |
| 3 | XGBoost overfits synthetic data | High | Low | Don't claim real-world accuracy; label PROTOTYPE | Use simple thresholds as fallback |
| 4 | Timeline too tight for full UI | Medium | Medium | Prioritize: gauge + chart + alert > polish | Minimal viable dashboard |
| 5 | MPU6050 gyro drift | Medium | Low | Startup calibration; complementary filter | Use accel-only tilt (no gyro) |
| 6 | SQLite lock contention | Low | Medium | WAL mode + busy timeout | Switch to single-writer pattern |
| 7 | WebSocket drops on network change | Low | Low | Auto-reconnect with backoff | REST polling fallback |
| 8 | Sensor wiring errors | Medium | Medium | Double-check wiring doc; test each sensor independently | Swap to spare components |

---

## 6. Definition of Done (Prototype)

The prototype is **complete** when:

- [ ] Mock data feeder generates realistic sensor telemetry
- [ ] Backend ingests, stores, and processes telemetry
- [ ] Risk engine computes FoS + XGBoost risk score + SHAP explanation
- [ ] Alerts trigger at HIGH and CRITICAL risk levels
- [ ] WebSocket pushes live updates to dashboard
- [ ] Dashboard shows: risk gauge, sensor cards, time-series, SHAP chart, alerts
- [ ] "PROTOTYPE" label is visible on all screens
- [ ] Real ESP32 sensor data can replace mock data with zero code changes
- [ ] End-to-end demo runs locally without Internet
- [ ] README and setup guide are written

---

## 7. Out of Scope (Explicit)

These items are **intentionally excluded** from the 10-day prototype:

- ❌ Multiple sensor nodes
- ❌ LoRaWAN (using point-to-point LoRa)
- ❌ Raspberry Pi gateway
- ❌ Cloud deployment
- ❌ User authentication
- ❌ Deep learning / LSTM models
- ❌ GIS / DEM / satellite data
- ❌ Production-grade cybersecurity
- ❌ Real landslide prediction claims
- ❌ Mobile app
- ❌ Historical field dataset integration
- ❌ Automated CI/CD pipeline

These are documented in `ARCHITECTURE.md § Future Extensions` for later phases.

---

## 8. Implementation Order Rationale

```
Day 1-2: Backend + Mock Data
    ↓  (enables testing without hardware)
Day 3-4: Risk Engine + ML
    ↓  (core intelligence, needs backend)
Day 5-7: WebSocket + Frontend
    ↓  (needs backend + risk engine to be meaningful)
Day 8-9: Firmware + Hardware
    ↓  (hardware integration is riskiest — do it after software works)
Day 10: Polish + Demo
```

**Why hardware last?** Hardware integration is the most unpredictable part
(wiring issues, calibration, LoRa range). By building the full software
pipeline first with mock data, we can demo even if hardware has issues.
The mock feeder acts as a complete hardware substitute.
