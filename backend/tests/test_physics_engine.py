import pytest
from app.services.risk_engine.physics import GeotechnicalPhysicsEngine
from app.services.risk_engine.features import FeatureEngineeringPipeline
from app.services.risk_engine.risk_engine import GrayBoxRiskEngine
from app.services.risk_engine.config import GeotechnicalConfig, RiskEngineConfig


class TestPhysicsEngine:
    @pytest.fixture
    def physics(self):
        return GeotechnicalPhysicsEngine()

    @pytest.fixture
    def engine(self):
        return GrayBoxRiskEngine()

    def test_normal_baseline_conditions(self, engine):
        """Under baseline dry conditions on a mild slope, FoS must be stable (> 1.45) and risk LOW/MODERATE."""
        res = engine.evaluate(
            soil_moisture_pct=18.0,
            rainfall_pct=0.0,
            rainfall_24h_mm=0.0,
            slope_angle_deg=20.0,
            tilt_rate_deg_min=0.0,
        )
        assert res["factor_of_safety"] >= 1.45
        assert res["risk_score"] < 0.25
        assert res["risk_level"] == "LOW"
        assert res["physics_risk_level"] == "LOW"

    def test_increasing_moisture_reduces_fos(self, physics, engine):
        """As soil moisture increases from 10% to 95%, FoS must decrease monotonically and risk must rise."""
        moistures = [10.0, 30.0, 50.0, 70.0, 90.0]
        fos_values = []
        risk_scores = []

        for m in moistures:
            res = engine.evaluate(
                soil_moisture_pct=m,
                rainfall_pct=10.0,
                rainfall_24h_mm=10.0,
                slope_angle_deg=25.0,
                tilt_rate_deg_min=0.005,
            )
            fos_values.append(res["factor_of_safety"])
            risk_scores.append(res["risk_score"])

        # Verify strict monotonic FoS degradation
        for i in range(len(fos_values) - 1):
            assert fos_values[i] >= fos_values[i + 1], f"FoS did not decrease: {fos_values}"
            assert risk_scores[i] <= risk_scores[i + 1], f"Risk did not increase: {risk_scores}"

    def test_increasing_rainfall_increases_risk(self, engine):
        """As cumulative rainfall increases, risk score must rise."""
        res_dry = engine.evaluate(
            soil_moisture_pct=40.0,
            rainfall_pct=0.0,
            rainfall_24h_mm=0.0,
            slope_angle_deg=24.0,
            tilt_rate_deg_min=0.0,
        )
        res_heavy_rain = engine.evaluate(
            soil_moisture_pct=40.0,
            rainfall_pct=80.0,
            rainfall_24h_mm=75.0,
            slope_angle_deg=24.0,
            tilt_rate_deg_min=0.0,
        )
        assert res_heavy_rain["risk_score"] > res_dry["risk_score"]

    def test_increasing_tilt_and_creep_triggers_critical(self, engine):
        """Steep slopes with accelerating creep rates must trigger CRITICAL hazard status."""
        res_steep_creep = engine.evaluate(
            soil_moisture_pct=88.0,
            rainfall_pct=90.0,
            rainfall_24h_mm=95.0,
            slope_angle_deg=42.0,
            tilt_rate_deg_min=0.25,
        )
        assert res_steep_creep["factor_of_safety"] < 1.00
        assert res_steep_creep["risk_level"] == "CRITICAL"
        assert res_steep_creep["risk_score"] >= 0.75

    def test_critical_failure_boundary(self, engine):
        """Whenever FoS < 1.0, risk level MUST be CRITICAL regardless of heuristics."""
        res = engine.evaluate(
            soil_moisture_pct=99.0,
            rainfall_pct=100.0,
            rainfall_24h_mm=150.0,
            slope_angle_deg=45.0,
            tilt_rate_deg_min=0.50,
        )
        assert res["factor_of_safety"] < 1.00
        assert res["risk_level"] == "CRITICAL"

    def test_configurable_soil_parameters(self):
        """Custom geotechnical parameters must properly shift the stability equilibrium."""
        # Strong bedrock soil with high cohesion (c' = 25 kPa, φ' = 38°)
        strong_config = GeotechnicalConfig(cohesion_kpa=25.0, friction_angle_deg=38.0)
        strong_physics = GeotechnicalPhysicsEngine(strong_config)
        fos_strong = strong_physics.compute_factor_of_safety(soil_moisture_pct=50.0, slope_angle_deg=30.0)

        # Weak sandy colluvium with low cohesion (c' = 2.0 kPa, φ' = 20°)
        weak_config = GeotechnicalConfig(cohesion_kpa=2.0, friction_angle_deg=20.0)
        weak_physics = GeotechnicalPhysicsEngine(weak_config)
        fos_weak = weak_physics.compute_factor_of_safety(soil_moisture_pct=50.0, slope_angle_deg=30.0)

        assert fos_strong > fos_weak
        assert fos_strong > 1.5

    def test_feature_engineering_vector(self):
        """Feature pipeline must extract all necessary numerical features for downstream ML."""
        features = FeatureEngineeringPipeline.extract_features(
            soil_moisture_pct=60.0,
            rainfall_pct=40.0,
            rainfall_24h_mm=35.0,
            slope_angle_deg=26.0,
            tilt_rate_deg_min=0.02,
            factor_of_safety=1.15,
        )
        expected_keys = [
            "soil_moisture_pct", "rainfall_pct", "rainfall_24h_mm",
            "slope_angle_deg", "tilt_rate_deg_min", "factor_of_safety",
            "fos_vulnerability_index", "moisture_norm", "rain_24h_norm",
            "moisture_rain_interaction", "creep_kinematic_index",
        ]
        for key in expected_keys:
            assert key in features, f"Missing key in feature vector: {key}"
            assert isinstance(features[key], (int, float))

    def test_shap_values_structure(self, engine):
        """Every assessment must produce ordered SHAP feature attribution metrics."""
        res = engine.evaluate(
            soil_moisture_pct=85.0,
            rainfall_pct=70.0,
            rainfall_24h_mm=60.0,
            slope_angle_deg=30.0,
            tilt_rate_deg_min=0.03,
        )
        shaps = res["shap_values"]
        assert len(shaps) >= 6
        assert all("feature" in s and "contribution" in s and "display_name" in s for s in shaps)
        # Verify sorted by absolute contribution
        for i in range(len(shaps) - 1):
            assert abs(shaps[i]["contribution"]) >= abs(shaps[i + 1]["contribution"])
