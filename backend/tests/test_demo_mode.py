"""
Tests for Phases 11 & 17 — SIH Demo Mode & Laboratory Simulation
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.demo_service import demo_service, DEMO_STAGES, SIH_DEMO_STATES, DEMO_DISCLAIMER


class TestPhysicalDemoMode:
    @pytest.fixture(autouse=True)
    def reset_demo_state(self):
        demo_service.reset()
        yield
        demo_service.reset()

    def test_demo_status_endpoint(self, client: TestClient):
        response = client.get("/api/demo/status")
        assert response.status_code == 200
        data = response.json()
        assert data["demo_mode"] is True
        assert data["disclaimer"] == DEMO_DISCLAIMER
        assert "Controlled" in data["disclaimer"]
        assert data["current_stage"] == 1
        assert len(data["all_stages"]) == 4
        assert len(data["all_sih_states"]) == 6

    def test_sih_states_endpoint(self, client: TestClient):
        response = client.get("/api/demo/states")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 6
        keys = [s["key"] for s in data]
        assert keys == ["NORMAL", "RAIN", "HEAVY_RAIN", "SATURATION", "SLOPE_MOVEMENT", "CRITICAL"]

    def test_sih_state_normal(self, client: TestClient):
        """NORMAL: Dry soil, stable tilt, FoS > 1.8, LOW risk"""
        res = client.post("/api/demo/state/NORMAL")
        assert res.status_code == 200
        data = res.json()
        assert data["sih_state"] == "NORMAL"
        assert data["telemetry"]["soil_moisture"] < 25.0
        assert data["risk"]["risk_level"] in ["LOW", "MODERATE"]
        assert data["risk"]["factor_of_safety"] >= 1.60

    def test_sih_state_rain(self, client: TestClient):
        """RAIN: Onset precipitation, rain detected, moisture rising"""
        res = client.post("/api/demo/state/RAIN")
        assert res.status_code == 200
        data = res.json()
        assert data["sih_state"] == "RAIN"
        assert data["telemetry"]["rainfall"] > 25.0
        assert data["telemetry"]["soil_moisture"] > 30.0

    def test_sih_state_heavy_rain(self, client: TestClient):
        """HEAVY_RAIN: Downpour, moisture threshold crossed"""
        res = client.post("/api/demo/state/HEAVY_RAIN")
        assert res.status_code == 200
        data = res.json()
        assert data["sih_state"] == "HEAVY_RAIN"
        assert data["telemetry"]["soil_moisture"] > 50.0
        assert data["telemetry"]["rainfall"] > 60.0

    def test_sih_state_saturation(self, client: TestClient):
        """SATURATION: Pore saturation, FoS drops, HIGH risk alert"""
        res = client.post("/api/demo/state/SATURATION")
        assert res.status_code == 200
        data = res.json()
        assert data["sih_state"] == "SATURATION"
        assert data["telemetry"]["soil_moisture"] > 75.0
        assert data["risk"]["factor_of_safety"] < 1.30
        assert data["risk"]["risk_level"] in ["HIGH", "CRITICAL"]

    def test_sih_state_slope_movement(self, client: TestClient):
        """SLOPE_MOVEMENT: Active angular tilt displacement, FoS < 1.0, CRITICAL alarm"""
        res = client.post("/api/demo/state/SLOPE_MOVEMENT")
        assert res.status_code == 200
        data = res.json()
        assert data["sih_state"] == "SLOPE_MOVEMENT"
        assert data["telemetry"]["tilt_angle"] > 28.0
        assert data["risk"]["factor_of_safety"] < 1.05
        assert data["risk"]["risk_level"] == "CRITICAL"

    def test_sih_state_critical(self, client: TestClient):
        """CRITICAL: Imminent slope collapse, FoS < 0.8, emergency alarm"""
        res = client.post("/api/demo/state/CRITICAL")
        assert res.status_code == 200
        data = res.json()
        assert data["sih_state"] == "CRITICAL"
        assert data["telemetry"]["tilt_angle"] > 35.0
        assert data["risk"]["factor_of_safety"] < 0.90
        assert data["risk"]["risk_level"] == "CRITICAL"
        assert data["risk"]["risk_score"] >= 0.80

    def test_sih_state_invalid_key(self, client: TestClient):
        res = client.post("/api/demo/state/INVALID_STATE_XYZ")
        assert res.status_code == 400

    def test_full_6_state_progression_trajectory(self, client: TestClient):
        """Verify full progression: NORMAL -> RAIN -> HEAVY_RAIN -> SATURATION -> SLOPE_MOVEMENT -> CRITICAL"""
        states = ["NORMAL", "RAIN", "HEAVY_RAIN", "SATURATION", "SLOPE_MOVEMENT", "CRITICAL"]
        for st in states:
            res = client.post(f"/api/demo/state/{st}")
            assert res.status_code == 200
            assert res.json()["sih_state"] == st

    def test_legacy_stage_endpoints(self, client: TestClient):
        """Verify backwards compatibility with 1-4 stages"""
        for s in [1, 2, 3, 4]:
            res = client.post(f"/api/demo/stage/{s}")
            assert res.status_code == 200
            assert res.json()["stage"] == s

    def test_demo_reset(self, client: TestClient):
        client.post("/api/demo/state/CRITICAL")
        res_reset = client.post("/api/demo/reset")
        assert res_reset.status_code == 200
        assert res_reset.json()["state"] == "NORMAL"
        
        status_res = client.get("/api/demo/status")
        assert status_res.json()["current_sih_state"] == "NORMAL"
