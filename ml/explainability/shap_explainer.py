import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import shap


DISPLAY_NAMES = {
    "soil_moisture": "Soil Moisture",
    "rainfall": "Rainfall Intensity",
    "rainfall_24h": "24h Cumulative Precipitation",
    "slope_angle": "Slope Dip Angle",
    "tilt_rate": "Displacement Creep Rate",
    "factor_of_safety": "Factor of Safety (FoS)",
}


class LandguardShapExplainer:
    """
    Computes exact local Shapley feature attributions using SHAP TreeExplainer
    for the LANDGUARD AI prototype XGBoost model.
    """

    def __init__(self, model: Any, feature_names: Optional[List[str]] = None):
        self.model = model
        self.feature_names = feature_names or [
            "soil_moisture",
            "rainfall",
            "rainfall_24h",
            "slope_angle",
            "tilt_rate",
            "factor_of_safety",
        ]
        self.explainer = shap.TreeExplainer(model)

    def explain_instance(self, features_dict: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Computes SHAP feature attributions for a single telemetry reading.
        
        Returns a sorted list of contributing factors with directional impact:
        - impact: "positive" if the feature pushes risk higher
        - impact: "negative" if the feature stabilizes / reduces risk
        """
        # Ensure correct column ordering
        row = np.array([[features_dict.get(col, 0.0) for col in self.feature_names]])
        df_row = pd.DataFrame(row, columns=self.feature_names)

        shap_vals = self.explainer.shap_values(df_row)
        
        # Handle binary classification (shap_vals is 2D or list of 2 arrays)
        if isinstance(shap_vals, list):
            vals = shap_vals[1][0]
        elif len(shap_vals.shape) == 2:
            vals = shap_vals[0]
        else:
            vals = shap_vals

        factors = []
        for feat, val in zip(self.feature_names, vals):
            raw_val = float(features_dict.get(feat, 0.0))
            contrib = float(val)
            impact = "positive" if contrib > 0.001 else ("negative" if contrib < -0.001 else "neutral")
            
            factors.append({
                "feature": feat,
                "display_name": DISPLAY_NAMES.get(feat, feat),
                "raw_value": round(raw_val, 2),
                "impact": impact,
                "contribution": round(contrib, 4),
            })

        # Sort by absolute magnitude of contribution
        factors.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return factors
