from app.services.risk_engine import risk_engine


def test_physics_risk_engine_calculation():
    # Dry stable condition
    result_dry = risk_engine.compute_risk(
        soil_moisture_pct=20.0,
        rainfall_pct=0.0,
        rainfall_24h_mm=2.0,
        tilt_angle_deg=22.0,
        tilt_rate_deg_min=0.0,
    )
    assert result_dry["risk_level"] in ["LOW", "MODERATE"]
    assert result_dry["factor_of_safety"] > 1.3
    assert result_dry["risk_score"] < 0.35

    # Critical crisis condition (high moisture, heavy rain, steep angle, rapid tilt)
    result_crisis = risk_engine.compute_risk(
        soil_moisture_pct=95.0,
        rainfall_pct=95.0,
        rainfall_24h_mm=120.0,
        tilt_angle_deg=45.0,
        tilt_rate_deg_min=0.35,
    )
    assert result_crisis["risk_level"] == "CRITICAL"
    assert result_crisis["risk_score"] >= 0.75
    assert len(result_crisis["shap_values"]) >= 5


def test_get_latest_risk_endpoint(client):
    # Ingest a reading first
    client.post("/api/telemetry", json={
        "node_id": "LG-N01",
        "soil_moisture": 50.0,
        "rainfall": 20.0,
        "rainfall_24h": 30.0,
        "tilt_angle": 25.0,
        "tilt_rate": 0.02,
        "battery": 80.0,
        "rssi": -65,
        "snr": 9.0,
    })

    response = client.get("/api/risk/LG-N01")
    assert response.status_code == 200
    data = response.json()
    assert data["node_id"] == "LG-N01"
    assert "factor_of_safety" in data
    assert "risk_score" in data
    assert "risk_level" in data
    assert "shap_values" in data
    assert len(data["shap_values"]) >= 5


def test_get_risk_history_endpoint(client):
    # Generate 2 readings
    client.post("/api/telemetry/mock/generate?scenario=heavy_rain&count=2&node_id=LG-N01")

    response = client.get("/api/risk/LG-N01/history?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["node_id"] == "LG-N01"
    assert data["count"] >= 2
    assert len(data["assessments"]) >= 2
