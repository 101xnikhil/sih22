import pytest
from fastapi.testclient import TestClient
from app.services.security_service import security_service


def test_replay_detection_rejects_duplicate_sequence(client: TestClient):
    security_service.reset_watermarks()

    payload = {
        "node_id": "LG-N01",
        "seq_num": 1842,
        "soil_moisture": 25.0,
        "rainfall": 0.0,
        "rainfall_24h": 0.0,
        "tilt_angle": 22.0,
        "tilt_rate": 0.0,
        "battery": 90.0,
        "rssi": -65,
        "snr": 9.0,
    }

    # First attempt: Sequence 1842 -> ACCEPT
    res1 = client.post("/api/telemetry", json=payload)
    assert res1.status_code == 201
    data1 = res1.json()
    assert data1["action"] == "ACCEPTED"
    assert data1["seq_num"] == 1842

    # Second attempt: Sequence 1842 again -> REJECT — REPLAY DETECTED
    res2 = client.post("/api/telemetry", json=payload)
    assert res2.status_code == 409
    assert "REPLAY DETECTED" in res2.json()["detail"]

    # Lower sequence number 1840 -> also REJECT — REPLAY DETECTED
    payload_lower = {**payload, "seq_num": 1840}
    res3 = client.post("/api/telemetry", json=payload_lower)
    assert res3.status_code == 409

    # Monotonically increasing sequence 1843 -> ACCEPT
    payload_next = {**payload, "seq_num": 1843}
    res4 = client.post("/api/telemetry", json=payload_next)
    assert res4.status_code == 201


def test_unauthorized_device_rejection(client: TestClient):
    payload = {
        "node_id": "ROGUE-NODE-99",
        "seq_num": 100,
        "soil_moisture": 25.0,
        "rainfall": 0.0,
        "rainfall_24h": 0.0,
        "tilt_angle": 22.0,
        "tilt_rate": 0.0,
        "battery": 90.0,
        "rssi": -65,
        "snr": 9.0,
    }
    res = client.post("/api/telemetry", json=payload)
    assert res.status_code == 403
    assert "UNAUTHORIZED" in res.json()["detail"]


def test_security_audit_events_endpoint(client: TestClient):
    client.post("/api/telemetry", json={
        "node_id": "LG-N01",
        "seq_num": 999,
        "soil_moisture": 25.0,
        "rainfall": 0.0,
        "rainfall_24h": 0.0,
        "tilt_angle": 22.0,
        "tilt_rate": 0.0,
        "battery": 90.0,
        "rssi": -65,
        "snr": 9.0,
    })
    res = client.get("/api/security/events")
    assert res.status_code == 200
    data = res.json()
    assert "count" in data
    assert "events" in data
    assert len(data["events"]) >= 1
    sample = data["events"][0]
    assert "timestamp" in sample
    assert "node_id" in sample
    assert "sequence_num" in sample
    assert "action" in sample
    assert "reason" in sample


def test_security_status_endpoint(client: TestClient):
    res = client.get("/api/security/status")
    assert res.status_code == 200
    data = res.json()
    assert data["is_active"] is True
    assert data["replay_protection_enabled"] is True
    assert "LG-N01" in data["authorized_nodes"]


def test_offline_sync_flushes_buffered_telemetry(client: TestClient):
    security_service.reset_watermarks()

    batch = [
        {
            "node_id": "LG-N01",
            "seq_num": 2001,
            "soil_moisture": 30.0,
            "rainfall": 5.0,
            "rainfall_24h": 2.0,
            "tilt_angle": 22.1,
            "tilt_rate": 0.001,
            "battery": 88.0,
            "rssi": -70,
            "snr": 8.0,
        },
        {
            "node_id": "LG-N01",
            "seq_num": 2002,
            "soil_moisture": 32.0,
            "rainfall": 10.0,
            "rainfall_24h": 5.0,
            "tilt_angle": 22.2,
            "tilt_rate": 0.002,
            "battery": 87.0,
            "rssi": -71,
            "snr": 8.0,
        },
    ]

    res = client.post("/api/telemetry/sync", json=batch)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "sync_completed"
    assert data["ingested_count"] == 2
    assert data["rejected_replays"] == 0
