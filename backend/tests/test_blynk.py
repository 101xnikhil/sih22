import pytest


def test_blynk_sync_validation(client):
    # Missing token should return 400
    response = client.post("/api/blynk/sync", json={"auth_token": ""})
    assert response.status_code == 400

    # Default placeholder token should return 400
    response = client.post("/api/blynk/sync", json={"auth_token": "YOUR_BLYNK_AUTH_TOKEN"})
    assert response.status_code == 400


def test_blynk_sync_with_token(client):
    response = client.post("/api/blynk/sync", json={"auth_token": "test_token_123", "node_id": "LG-N01"})
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "virtual_pins" in data


def test_blynk_webhook_ingest(client):
    payload = {
        "node_id": "LG-N01",
        "soil_moisture": 45.0,
        "rainfall": 12.0,
        "tilt_angle": 24.5,
        "tilt_rate": 0.01,
        "battery_pct": 95.0,
        "rssi_dbm": -58,
    }
    response = client.post("/api/blynk/webhook", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert "risk_level" in data
    assert "factor_of_safety" in data
