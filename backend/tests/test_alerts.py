import pytest
from fastapi.testclient import TestClient


def test_alert_generation_and_schema(client: TestClient):
    # Ingest critical reading to trigger an alert
    response = client.post("/api/telemetry", json={
        "node_id": "LG-N01",
        "soil_moisture": 95.0,
        "rainfall": 90.0,
        "rainfall_24h": 120.0,
        "tilt_angle": 45.0,
        "tilt_rate": 0.35,
        "battery": 60.0,
        "rssi": -85,
        "snr": 4.0,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["alert"] is not None
    alert_id = data["alert"]["id"]

    # Query alert list
    alerts_res = client.get("/api/alerts")
    assert alerts_res.status_code == 200
    alerts_data = alerts_res.json()
    assert alerts_data["count"] >= 1
    assert alerts_data["unacknowledged_count"] >= 1

    # Check alert structure
    latest_alert = alerts_data["alerts"][0]
    assert "alert_id" in latest_alert
    assert latest_alert["node_id"] == "LG-N01"
    assert "timestamp" in latest_alert
    assert "risk_score" in latest_alert
    assert latest_alert["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "trigger_reason" in latest_alert
    assert "acknowledged" in latest_alert
    assert "created_at" in latest_alert


def test_trigger_reasons_derivation(client: TestClient):
    # Post telemetry with high moisture and high tilt rate
    res = client.post("/api/telemetry", json={
        "node_id": "LG-N01",
        "soil_moisture": 88.0,
        "rainfall": 70.0,
        "rainfall_24h": 50.0,
        "tilt_angle": 38.0,
        "tilt_rate": 0.12,
        "battery": 80.0,
        "rssi": -65,
        "snr": 8.0,
    })
    assert res.status_code == 201
    alert_info = res.json().get("alert")
    if alert_info:
        detail_res = client.get(f"/api/alerts/{alert_info['id']}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert len(detail["trigger_reasons"]) > 0
        reasons_text = " ".join(detail["trigger_reasons"])
        assert any(k in reasons_text.lower() for k in ["moisture", "tilt", "stability", "indicator"])


def test_alert_acknowledgment(client: TestClient):
    # Ingest critical reading to trigger an alert
    ingest_res = client.post("/api/telemetry", json={
        "node_id": "LG-N01",
        "soil_moisture": 98.0,
        "rainfall": 95.0,
        "rainfall_24h": 150.0,
        "tilt_angle": 48.0,
        "tilt_rate": 0.45,
        "battery": 50.0,
        "rssi": -90,
        "snr": 3.0,
    })
    alert_id = ingest_res.json()["alert"]["id"]

    # Acknowledge the alert
    ack_res = client.post(f"/api/alerts/{alert_id}/acknowledge")
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["id"] == alert_id
    assert ack_data["acknowledged"] is True
    assert ack_data["acknowledged_at"] is not None


def test_acknowledge_invalid_alert(client: TestClient):
    response = client.post("/api/alerts/99999/acknowledge")
    assert response.status_code == 404
