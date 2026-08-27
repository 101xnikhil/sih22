# LANDGUARD AI — Production & SIH Deployment Guide

> **Target Platform:** Smart India Hackathon (SIH 2026) Prototype & Edge Production  
> **Document Version:** v1.0.0  
> **Architecture:** Edge-Native / Offline-First / Zero Cloud Dependency  

---

## 1. Architecture & Deployment Matrix

LANDGUARD AI supports two operational deployment topologies:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MODE 1: LOCAL SIH DEMO (OFFLINE-FIRST / ZERO INTERNET)                                 │
│                                                                                        │
│  [ ESP32 Sensor Node ]                                                                 │
│         │ (LoRa 433MHz RF)                                                             │
│         ▼                                                                              │
│  [ ESP32 LoRa Gateway ] ──(USB / Wi-Fi SoftAP)──> [ Local Laptop FastAPI (Port 8000) ]│
│                                                           │                            │
│                                                    [ Local SQLite DB ]                 │
│                                                    [ Local XGBoost ML ]                │
│                                                           │                            │
│                                                           ▼ (WebSocket / REST)         │
│                                                    [ Local React App (Port 5173) ]     │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MODE 2: PUBLIC CLOUD DEMO (DISTRIBUTED ACCESS)                                         │
│                                                                                        │
│  [ ESP32 Gateway (Field) ] ──(4G/Wi-Fi HTTPS)──> [ Cloud FastAPI Service (Render/EC2) ]│
│                                                           │                            │
│                                                    [ Persistent DB / Cloud Run ]       │
│                                                           │                            │
│                                                           ▼ (WSS / HTTPS)              │
│                                                    [ Hosted React UI (Vercel/Netlify) ]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Deployment Mode 1: Local SIH Demo (Recommended for Evaluation)

This mode operates **100% offline without requiring internet access or external cloud services**.

### Prerequisites
- Python 3.9+ (with `venv`)
- Node.js 18+ and `npm`
- Git

### Step 1: Environment Setup
From the repository root, copy the environment template:

```bash
cp .env.example .env
```

Default `.env` values for Local Demo:
```ini
VITE_API_URL=http://127.0.0.1:8000
BACKEND_URL=http://127.0.0.1:8000
DATABASE_URL=sqlite:///./landguard.db
```

---

### Step 2: Backend Setup & Startup (FastAPI)

1. Navigate to the backend directory and set up Python virtual environment:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Start the local FastAPI server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

> **Verification:** Open `http://127.0.0.1:8000/api/health` in your browser. Expected response: `{"status":"ok","timestamp":"...","database":"connected","physics_engine":"active","ml_engine":"active"}`.

---

### Step 3: Frontend Setup & Production Build (React / Vite)

1. In a second terminal tab, navigate to the frontend directory:
```bash
cd frontend
npm install
```

2. Build the production static web bundle:
```bash
npm run build
```

3. Preview / Serve the production build locally:
```bash
npx serve -s dist -l 5173
```
*(Or use `npm run dev` for hot-reload during presentation).*

> **Mission Control UI:** Open `http://localhost:5173` in your browser.

---

### Step 4: Connecting ESP32 Hardware or Running Lab Demo

- **Physical Lab Demo (Miniature Soil Sandbox):** Select **PHYSICAL DEMO** in the dashboard header or run the automated sequence:
  ```bash
  python3 tools/physical_demo_runner.py
  ```
- **Real ESP32 Gateway Hardware:** Power the ESP32 Gateway and connect to local Wi-Fi / USB. Ensure gateway is pointed to `http://<laptop-ip>:8000/api/telemetry`.
- **System Verification Suite:** Execute all automated bench checks:
  ```bash
  python3 tools/bench_test.py
  ```

---

## 3. Deployment Mode 2: Public Cloud Demo

Use this mode to host LANDGUARD AI publicly for remote evaluations or multi-user access.

### Backend Cloud Hosting (Render / Railway / AWS EC2 / GCP Cloud Run)

1. **Deploy Repository:** Connect your GitHub repository to your cloud provider.
2. **Root Directory:** `backend`
3. **Build Command:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Command:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. **Environment Variables:**
   - `BACKEND_URL`: `https://landguard-backend.onrender.com`
   - `DATABASE_URL`: `sqlite:///./landguard.db` (or PostgreSQL URI: `postgresql://user:pass@host:5432/landguard`)
   - `CORS_ORIGINS`: `https://landguard.vercel.app,http://localhost:5173`

---

### Frontend Cloud Hosting (Vercel / Netlify / Cloudflare Pages)

1. **Deploy Repository:** Connect GitHub repository to Vercel/Netlify.
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Environment Variables:**
   - `VITE_API_URL`: `https://landguard-backend.onrender.com`

---

## 4. Operational Health & API Verification Endpoints

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/health` | `GET` | System health, database connectivity, and engine states |
| `/api/telemetry` | `POST` | Ingest 32-byte LoRa packet payload from gateway |
| `/api/telemetry/sync` | `POST` | Bulk synchronization of gateway-buffered offline packets |
| `/api/telemetry/{node_id}/history` | `GET` | Retrieve chronological sensor readings for charts |
| `/api/risk/{node_id}` | `GET` | Get real-time Factor of Safety (FoS) & ML risk score |
| `/api/alerts` | `GET` | List active emergency warnings and trigger reasons |
| `/api/security/events` | `GET` | Retrieve cybersecurity audit events (replays, rogue nodes) |
| `/ws/telemetry` | `WebSocket` | Real-time live bi-directional stream to dashboard |

---

## 5. Troubleshooting & Port Configuration

- **Port 8000 Conflict:** If port 8000 is occupied, run backend on port 8001:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8001
  ```
  Set `VITE_API_URL=http://127.0.0.1:8001` in your frontend `.env` file before rebuilding.
- **WebSocket Disconnection:** Ensure firewall permits WebSocket upgrades (`ws://` and `wss://`).
- **Replay Attack Testing:** If replaying identical sequence numbers during testing, reset watermarks via `POST /api/security/reset-watermarks` or restart the server.
