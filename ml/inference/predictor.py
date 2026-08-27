import os
import json
import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import joblib

from app.services.risk_engine.physics import GeotechnicalPhysicsEngine
from app.services.risk_engine.config import GeotechnicalConfig
from ml.explainability.shap_explainer import LandguardShapExplainer

logger = logging.getLogger("landguard.ml")


class LandguardMLPredictor:
    """
    Inference service for the LANDGUARD AI prototype machine learning layer.
    Combines gradient boosted probability estimation with real-time SHAP feature attributions.
    """

    def __init__(
        self,
        model_path: str = "ml/models/xgboost_bundle.joblib",
        metadata_path: str = "ml/models/metadata.json",
    ):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.physics = GeotechnicalPhysicsEngine(GeotechnicalConfig())
        self.model = None
        self.features: List[str] = [
            "soil_moisture",
            "rainfall",
            "rainfall_24h",
            "slope_angle",
            "tilt_rate",
            "factor_of_safety",
        ]
        self.explainer: Optional[LandguardShapExplainer] = None
        self.model_version = "v0.1.0-synthetic-xgb"
        self._load_model()

    def _load_model(self):
        """Loads trained model bundle and initializes SHAP explainer."""
        if os.path.exists(self.model_path):
            try:
                bundle = joblib.load(self.model_path)
                self.model = bundle.get("model")
                self.features = bundle.get("features", self.features)
                self.explainer = LandguardShapExplainer(self.model, self.features)
                logger.info("Successfully loaded ML model bundle and initialized SHAP TreeExplainer.")
            except Exception as e:
                logger.warning(f"Failed to load model bundle from {self.model_path}: {e}")
        else:
            logger.info(f"Model file not found at {self.model_path}. Predictor will run in standalone mode.")

        if os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, "r") as f:
                    meta = json.load(f)
                    self.model_version = meta.get("model_version", self.model_version)
            except Exception:
                pass

    def predict(
        self,
        soil_moisture: float,
        rainfall: float,
        rainfall_24h: float,
        slope_angle: float,
        tilt_rate: float,
        factor_of_safety: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes ML inference and SHAP explainability on an incoming telemetry packet.
        """
        # Ensure FoS is present
        if factor_of_safety is None:
            fos = self.physics.compute_factor_of_safety(
                soil_moisture_pct=soil_moisture,
                slope_angle_deg=slope_angle,
            )
        else:
            fos = float(factor_of_safety)

        feature_dict = {
            "soil_moisture": float(soil_moisture),
            "rainfall": float(rainfall),
            "rainfall_24h": float(rainfall_24h),
            "slope_angle": float(slope_angle),
            "tilt_rate": float(tilt_rate),
            "factor_of_safety": float(fos),
        }

        # If model is loaded, compute inference
        if self.model is not None:
            row = np.array([[feature_dict[f] for f in self.features]])
            df_row = pd.DataFrame(row, columns=self.features)
            raw_prob = float(self.model.predict_proba(df_row)[0][1])
        else:
            # Fallback heuristic calculation if model not yet trained
            raw_prob = min(1.0, max(0.0, (soil_moisture / 100.0) * 0.4 + (rainfall_24h / 80.0) * 0.3 + max(0.0, 1.4 - fos) * 0.3))

        # Enforce physics boundary condition: if FoS < 1.0 (limit equilibrium sliding), risk must be at least 0.75
        if fos < 1.00:
            risk_prob = max(0.75, raw_prob)
        else:
            risk_prob = raw_prob

        # Format output fields
        risk_score_pct = int(round(risk_prob * 100))
        
        if risk_score_pct >= 75 or fos < 1.00:
            risk_level = "CRITICAL"
        elif risk_score_pct >= 50 or fos < 1.20:
            risk_level = "HIGH"
        elif risk_score_pct >= 25 or fos < 1.45:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        # Model confidence estimate (higher confidence when further from boundary)
        distance_from_boundary = abs(risk_prob - 0.50)
        confidence = round(0.75 + 0.20 * (distance_from_boundary / 0.50), 2)

        # Generate SHAP explanation
        top_factors = []
        if self.explainer is not None:
            try:
                top_factors = self.explainer.explain_instance(feature_dict)
            except Exception as e:
                logger.warning(f"SHAP explanation failed: {e}")

        if not top_factors:
            # Fallback factor breakdown covering all input features
            top_factors = [
                {"feature": "soil_moisture", "display_name": "Soil Moisture", "raw_value": soil_moisture, "impact": "positive" if soil_moisture > 50 else "negative", "contribution": round((soil_moisture - 50) / 200, 3)},
                {"feature": "factor_of_safety", "display_name": "Factor of Safety (FoS)", "raw_value": fos, "impact": "positive" if fos < 1.2 else "negative", "contribution": round((1.3 - fos) / 4, 3)},
                {"feature": "rainfall_24h", "display_name": "24h Rainfall", "raw_value": rainfall_24h, "impact": "positive" if rainfall_24h > 30 else "negative", "contribution": round((rainfall_24h - 30) / 250, 3)},
                {"feature": "slope_angle", "display_name": "Slope Angle", "raw_value": slope_angle, "impact": "positive" if slope_angle > 25 else "negative", "contribution": round((slope_angle - 20) / 100, 3)},
                {"feature": "tilt_rate", "display_name": "Creep Displacement Velocity", "raw_value": tilt_rate, "impact": "positive" if abs(tilt_rate) > 0.02 else "negative", "contribution": round(tilt_rate * 2.0, 3)},
                {"feature": "rainfall", "display_name": "Precipitation Rate", "raw_value": rainfall, "impact": "positive" if rainfall > 20 else "negative", "contribution": round((rainfall - 20) / 250, 3)},
            ]
            top_factors.sort(key=lambda x: abs(x["contribution"]), reverse=True)

        return {
            "risk_score": risk_score_pct,
            "risk_score_normalized": round(risk_prob, 3),
            "risk_level": risk_level,
            "confidence": confidence,
            "factor_of_safety": fos,
            "model_version": self.model_version,
            "top_factors": top_factors,
            "is_synthetic_demonstration": True,
            "input_features": feature_dict,
        }


predictor = LandguardMLPredictor()
