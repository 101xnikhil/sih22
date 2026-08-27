def test_ingest_telemetry_flat(client):
    payload = {
        "node_id": "LG-N01",
        "soil_moisture": 42.5,
        "rainfall": 15.0,
        "rainfall_24h": 22.4,
        "tilt_angle": 24.5,
        "tilt_rate": 0.012,
        "battery": 88.0,
        "rssi": -68,
        "snr": 9.2,
    }
    response = client.post("/api/telemetry", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["node_id"] == "LG-N01"
    assert "telemetry_id" in data
    assert "risk" in data
    assert data["risk"]["risk_score"] >= 0.0
    assert data["risk"]["factor_of_safety"] > 0.0
    assert "shap_values" in data["risk"]


def test_ingest_telemetry_nested_format(client):
    nested_payload = {
        "node_id": "LG-N01",
        "seq_num": 1045,
        "sensors": {
            "soil_moisture": {"raw": 1850, "pct": 55.0},
            "rain": {"raw": 1200, "intensity_pct": 40.0, "accum_24h_mm": 35.0, "detected": True},
            "tilt": {"angle_deg": 26.0, "rate_deg_min": 0.04},
            "accelerometer": {"x_g": 0.43, "y_g": 0.01, "z_g": 0.90},
            "gyroscope": {"x_dps": 0.1, "y_dps": 0.0, "z_dps": 0.0},
        },
        "battery": {"voltage_mv": 3820, "level_pct": 85.0},
        "network": {"rssi_dbm": -65, "snr_db": 9.5},
    }
    response = client.post("/api/telemetry", json=nested_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["node_id"] == "LG-N01"


def test_get_latest_telemetry(client):
    # Ingest one reading first
    client.post("/api/telemetry", json={
        "node_id": "LG-N01",
        "soil_moisture": 30.0,
        "rainfall": 5.0,
        "rainfall_24h": 10.0,
        "tilt_angle": 21.0,
        "tilt_rate": 0.0,
        "battery": 90.0,
        "rssi": -72,
        "snr": 8.5,
    })

    response = client.get("/api/telemetry/LG-N01")
    assert response.status_code == 200
    data = response.json()
    assert data["node_id"] == "LG-N01"
    assert data["soil_moisture"] == 30.0
    assert data["tilt_angle"] == 21.0


def test_get_telemetry_history(client):
    # Ingest 3 readings
    for i in range(3):
        client.post("/api/telemetry", json={
            "node_id": "LG-N01",
            "soil_moisture": 20.0 + i * 5,
            "rainfall": float(i),
            "rainfall_24h": float(i * 2),
            "tilt_angle": 20.0 + float(i),
            "tilt_rate": 0.001 * i,
            "battery": 95.0,
            "rssi": -70,
            "snr": 9.0,
        })

    response = client.get("/api/telemetry/LG-N01/history?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["node_id"] == "LG-N01"
    assert data["count"] >= 3
    assert len(data["readings"]) >= 3


def test_mock_generate_endpoint(client):
    response = client.post("/api/telemetry/mock/generate?scenario=moderate_rain&count=3&node_id=LG-N01")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "generated"
    assert data["count"] == 3
    assert len(data["readings"]) == 3
