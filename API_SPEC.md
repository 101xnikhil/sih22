# LANDGUARD AI — API Specification

> **Version**: 1.0 · **Base URL**: `http://localhost:8000` · **Status**: Prototype

---

## 1. REST API Endpoints

All REST endpoints are prefixed with `/api/v1`.
Responses follow a consistent envelope where applicable.

---

### 1.1 Health Check

```
GET /api/v1/health
```

**Response** `200 OK`:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "database": "connected",
  "model_loaded": true,
  "uptime_seconds": 3600,
  "timestamp": "2026-08-26T06:15:30Z"
}
```

---

### 1.2 Telemetry Ingestion

```
POST /api/v1/telemetry
Content-Type: application/json
```

**Request Body**: `TelemetryPayload` (see `TELEMETRY_SPEC.md`)

**Response** `201 Created`:
```json
{
  "reading_id": 42,
  "risk": {
    "risk_score": 0.73,
    "risk_level": "HIGH",
    "fos_estimate": 1.08,
    "features": {
      "soil_moisture_pct": 72.5,
      "tilt_angle_deg": 28.3,
      "tilt_rate_deg_per_min": 0.05,
      "rain_intensity_pct": 65.0,
      "cumulative_rain_1h": 58.2,
      "fos_estimate": 1.08,
      "moisture_rain_interaction": 47.1
    },
    "shap_values": {
      "soil_moisture_pct": 0.22,
      "cumulative_rain_1h": 0.18,
      "fos_estimate": 0.15,
      "tilt_angle_deg": 0.09,
      "rain_intensity_pct": 0.06,
      "tilt_rate_deg_per_min": 0.02,
      "moisture_rain_interaction": 0.01
    },
    "shap_base_value": 0.12,
    "model_version": "v0.1-synthetic"
  },
  "alert": {
    "id": 7,
    "severity": "HIGH",
    "message": "Risk level HIGH: FoS=1.08, Risk Score=0.73. Increased monitoring recommended."
  },
  "timestamp": "2026-08-26T06:15:30Z"
}
```

**Response** `422 Unprocessable Entity` (validation error):
```json
{
  "detail": [
    {
      "loc": ["body", "sensors", "soil_moisture", "pct"],
      "msg": "ensure this value is less than or equal to 100",
      "type": "value_error.number.not_le"
    }
  ]
}
```

**Notes**:
- The `risk` object is always returned (risk engine runs synchronously)
- The `alert` object is only present when risk ≥ HIGH
- The `reading_id` can be used to query the specific reading later

---

### 1.3 Sensor Readings History

```
GET /api/v1/readings
```

**Query Parameters**:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `node_id` | string | `"node-01"` | Filter by node |
| `start` | ISO 8601 datetime | 1 hour ago | Start of time range |
| `end` | ISO 8601 datetime | now | End of time range |
| `limit` | integer (1–1000) | 360 | Max readings to return |
| `order` | `asc` \| `desc` | `desc` | Sort order by timestamp |

**Response** `200 OK`:
```json
{
  "node_id": "node-01",
  "count": 120,
  "readings": [
    {
      "id": 42,
      "node_id": "node-01",
      "timestamp": "2026-08-26T06:15:30Z",
      "soil_moisture_pct": 42.5,
      "tilt_angle_deg": 22.4,
      "rain_intensity_pct": 35.0,
      "rain_detected": true,
      "battery_mv": 3820,
      "rssi_dbm": -82
    }
  ]
}
```

**Notes**:
- Returns a simplified view (not all raw sensor fields)
- For full raw data, use `GET /api/v1/readings/{id}`

---

### 1.4 Single Reading Detail

```
GET /api/v1/readings/{reading_id}
```

**Response** `200 OK`:
```json
{
  "id": 42,
  "node_id": "node-01",
  "timestamp": "2026-08-26T06:15:30Z",
  "received_at": "2026-08-26T06:15:31Z",
  "soil_moisture_raw": 2048,
  "soil_moisture_pct": 42.5,
  "accel_x": 0.12,
  "accel_y": -0.03,
  "accel_z": 0.98,
  "gyro_x": 0.5,
  "gyro_y": -0.2,
  "gyro_z": 0.1,
  "tilt_angle_deg": 22.4,
  "rain_analog": 3200,
  "rain_intensity_pct": 35.0,
  "rain_detected": true,
  "battery_mv": 3820,
  "rssi_dbm": -82,
  "snr_db": 9.5,
  "seq_num": 1420
}
```

**Response** `404 Not Found`:
```json
{
  "detail": "Reading 9999 not found"
}
```

---

### 1.5 Current Risk Assessment

```
GET /api/v1/risk
```

**Query Parameters**:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `node_id` | string | `"node-01"` | Node to get risk for |

**Response** `200 OK`:
```json
{
  "node_id": "node-01",
  "timestamp": "2026-08-26T06:15:30Z",
  "reading_id": 42,
  "risk_score": 0.73,
  "risk_level": "HIGH",
  "fos_estimate": 1.08,
  "features": {
    "soil_moisture_pct": 72.5,
    "tilt_angle_deg": 28.3,
    "tilt_rate_deg_per_min": 0.05,
    "rain_intensity_pct": 65.0,
    "cumulative_rain_1h": 58.2,
    "fos_estimate": 1.08,
    "moisture_rain_interaction": 47.1
  },
  "shap_values": {
    "soil_moisture_pct": 0.22,
    "cumulative_rain_1h": 0.18,
    "fos_estimate": 0.15,
    "tilt_angle_deg": 0.09,
    "rain_intensity_pct": 0.06,
    "tilt_rate_deg_per_min": 0.02,
    "moisture_rain_interaction": 0.01
  },
  "shap_base_value": 0.12,
  "model_version": "v0.1-synthetic"
}
```

**Response** `404 Not Found` (no assessments yet):
```json
{
  "detail": "No risk assessments available for node-01"
}
```

---

### 1.6 Risk Assessment History

```
GET /api/v1/risk/history
```

**Query Parameters**:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `node_id` | string | `"node-01"` | Filter by node |
| `start` | ISO 8601 datetime | 1 hour ago | Start of time range |
| `end` | ISO 8601 datetime | now | End of time range |
| `limit` | integer (1–500) | 100 | Max assessments to return |

**Response** `200 OK`:
```json
{
  "node_id": "node-01",
  "count": 50,
  "assessments": [
    {
      "timestamp": "2026-08-26T06:15:30Z",
      "risk_score": 0.73,
      "risk_level": "HIGH",
      "fos_estimate": 1.08
    }
  ]
}
```

---

### 1.7 Alerts

```
GET /api/v1/alerts
```

**Query Parameters**:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `severity` | `HIGH` \| `CRITICAL` \| (omit for all) | all | Filter by severity |
| `acknowledged` | boolean | (omit for all) | Filter by ack status |
| `limit` | integer (1–100) | 50 | Max alerts to return |

**Response** `200 OK`:
```json
{
  "count": 3,
  "alerts": [
    {
      "id": 7,
      "timestamp": "2026-08-26T06:15:30Z",
      "severity": "HIGH",
      "risk_score": 0.73,
      "risk_level": "HIGH",
      "message": "Risk level HIGH: FoS=1.08, Risk Score=0.73. Increased monitoring recommended.",
      "acknowledged": false,
      "acknowledged_at": null
    }
  ]
}
```

---

### 1.8 Acknowledge Alert

```
PATCH /api/v1/alerts/{alert_id}/acknowledge
```

**Response** `200 OK`:
```json
{
  "id": 7,
  "acknowledged": true,
  "acknowledged_at": "2026-08-26T06:20:00Z"
}
```

---

## 2. WebSocket API

### 2.1 Connection

```
ws://localhost:8000/ws/live
```

No authentication for prototype. Client connects and immediately begins
receiving server-pushed events.

### 2.2 Server → Client Events

All events are JSON objects with a `type` field:

#### `new_reading` — Sent on every telemetry ingestion

```json
{
  "type": "new_reading",
  "data": {
    "reading_id": 42,
    "node_id": "node-01",
    "timestamp": "2026-08-26T06:15:30Z",
    "soil_moisture_pct": 42.5,
    "tilt_angle_deg": 22.4,
    "rain_intensity_pct": 35.0,
    "rain_detected": true
  }
}
```

#### `risk_update` — Sent after each risk assessment

```json
{
  "type": "risk_update",
  "data": {
    "node_id": "node-01",
    "timestamp": "2026-08-26T06:15:30Z",
    "risk_score": 0.73,
    "risk_level": "HIGH",
    "fos_estimate": 1.08,
    "shap_values": {
      "soil_moisture_pct": 0.22,
      "cumulative_rain_1h": 0.18,
      "fos_estimate": 0.15,
      "tilt_angle_deg": 0.09,
      "rain_intensity_pct": 0.06,
      "tilt_rate_deg_per_min": 0.02,
      "moisture_rain_interaction": 0.01
    },
    "shap_base_value": 0.12
  }
}
```

#### `alert` — Sent when a new alert is triggered

```json
{
  "type": "alert",
  "data": {
    "id": 7,
    "timestamp": "2026-08-26T06:15:30Z",
    "severity": "HIGH",
    "risk_score": 0.73,
    "risk_level": "HIGH",
    "message": "Risk level HIGH: FoS=1.08, Risk Score=0.73. Increased monitoring recommended."
  }
}
```

#### `heartbeat` — Sent every 30 seconds

```json
{
  "type": "heartbeat",
  "data": {
    "server_time": "2026-08-26T06:15:30Z",
    "connected_clients": 2
  }
}
```

### 2.3 Client → Server Messages

#### `subscribe` (optional, future use)

```json
{
  "type": "subscribe",
  "node_id": "node-01"
}
```

For the prototype, the server broadcasts all events to all connected clients.
Node filtering will be added when multi-node support is implemented.

### 2.4 Connection Manager

The backend maintains a `ConnectionManager` that:
- Tracks active WebSocket connections
- Broadcasts events to all connected clients
- Sends heartbeat pings every 30 seconds
- Cleans up disconnected clients
- Uses `asyncio.Queue` to decouple ingestion from broadcast

---

## 3. Error Responses

All errors follow this format:

```json
{
  "detail": "Human-readable error message"
}
```

Or for validation errors (Pydantic):

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "error description",
      "type": "error_type"
    }
  ]
}
```

### HTTP Status Codes Used

| Code | Meaning | When |
|---|---|---|
| 200 | OK | Successful GET/PATCH |
| 201 | Created | Successful telemetry POST |
| 404 | Not Found | Reading/alert not found |
| 422 | Unprocessable Entity | Payload validation failed |
| 500 | Internal Server Error | Unexpected server error |

---

## 4. CORS Configuration

For local development, CORS is configured to allow:
- **Origins**: `http://localhost:5173` (Vite dev server), `http://localhost:3000`
- **Methods**: GET, POST, PATCH, OPTIONS
- **Headers**: Content-Type, Accept

---

## 5. Future API Extensions

| Endpoint | Purpose | When |
|---|---|---|
| `GET /api/v1/nodes` | List all registered sensor nodes | Multi-node support |
| `POST /api/v1/nodes/{id}/config` | Remote node configuration | Remote management |
| `GET /api/v1/analytics/summary` | Aggregated statistics | Analytics dashboard |
| `POST /api/v1/auth/token` | JWT authentication | Security hardening |
| `GET /api/v1/export/csv` | Export readings as CSV | Data export feature |
