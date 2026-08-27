import pytest
import os
import pandas as pd
from ml.data_generation.generate_synthetic_data import generate_synthetic_landslide_dataset
from ml.training.train_xgboost import train_prototype_model
from ml.inference.predictor import LandguardMLPredictor, predictor
from ml.explainability.shap_explainer import LandguardShapExplainer


class TestMLPipeline:
    def test_synthetic_data_generation(self, tmp_path):
        out_csv = str(tmp_path / "test_synthetic.csv")
        df = generate_synthetic_landslide_dataset(num_samples=200, output_path=out_csv)
        assert len(df) == 200
        assert "soil_moisture" in df.columns
        assert "factor_of_safety" in df.columns
        assert "hazard_label" in df.columns
        assert df["hazard_label"].nunique() == 2
        assert os.path.exists(out_csv)

    def test_model_training_and_metrics(self, tmp_path):
        data_csv = str(tmp_path / "train_synth.csv")
        generate_synthetic_landslide_dataset(num_samples=300, output_path=data_csv)
        
        train_res = train_prototype_model(
            data_path=data_csv,
            model_output_dir=str(tmp_path),
            random_state=42,
        )
        assert "metrics" in train_res
        assert "roc_auc" in train_res["metrics"]
        assert train_res["metrics"]["roc_auc"] >= 0.80
        assert os.path.exists(str(tmp_path / "xgboost_bundle.joblib"))
        assert os.path.exists(str(tmp_path / "metadata.json"))

    def test_ml_predictor_inference(self):
        # Test dry stable prediction
        res_dry = predictor.predict(
            soil_moisture=15.0,
            rainfall=0.0,
            rainfall_24h=0.0,
            slope_angle=20.0,
            tilt_rate=0.0,
        )
        assert isinstance(res_dry["risk_score"], int)
        assert res_dry["risk_score"] < 35
        assert res_dry["risk_level"] in ["LOW", "MODERATE"]
        assert res_dry["confidence"] >= 0.70
        assert res_dry["is_synthetic_demonstration"] is True
        assert len(res_dry["top_factors"]) >= 3

        # Test critical crisis prediction
        res_crisis = predictor.predict(
            soil_moisture=95.0,
            rainfall=95.0,
            rainfall_24h=120.0,
            slope_angle=42.0,
            tilt_rate=0.30,
        )
        assert res_crisis["risk_score"] >= 75
        assert res_crisis["risk_level"] == "CRITICAL"
        assert res_crisis["factor_of_safety"] < 1.00

    def test_shap_factors_directionality(self):
        res = predictor.predict(
            soil_moisture=92.0,
            rainfall=85.0,
            rainfall_24h=90.0,
            slope_angle=35.0,
            tilt_rate=0.15,
        )
        factors = res["top_factors"]
        assert len(factors) >= 5
        for f in factors:
            assert "feature" in f
            assert "display_name" in f
            assert "raw_value" in f
            assert f["impact"] in ["positive", "negative", "neutral"]
            assert isinstance(f["contribution"], float)

    def test_api_integration_with_ml(self, client):
        payload = {
            "node_id": "LG-N01",
            "soil_moisture": 72.0,
            "rainfall": 60.0,
            "rainfall_24h": 50.0,
            "tilt_angle": 28.0,
            "tilt_rate": 0.03,
            "battery": 85.0,
            "rssi": -68,
            "snr": 9.0,
        }
        res = client.post("/api/telemetry", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert "risk" in data
        assert "shap_values" in data["risk"]
        assert data["risk"]["risk_score"] >= 0.0
