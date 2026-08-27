# LANDGUARD AI — Machine Learning (XGBoost) Model Specification

> [!WARNING]
> **PROTOTYPE DEMONSTRATION & SYNTHETIC DATA DISCLAIMER**
> The machine learning model described here was trained on a **synthetic, physics-informed demonstration dataset** engineered for system architecture demonstration (SIH 2026). 
> **Do NOT claim or interpret synthetic benchmark metrics (e.g. 98% ROC-AUC) as operational real-world landslide prediction accuracy.** 
> Real-world deployment requires training on verified geological field inventories, in-situ borehole instruments, and regional meteorological data.

---

## 1. Motivation & Hybrid ML Architecture

In geological landslide early warning systems (LEWS), purely statistical ML models can generate physically impossible predictions (e.g., predicting safety when slope angle exceeds the angle of repose and soil is 100% saturated).

LANDGUARD AI resolves this using a **Physics-Informed Hybrid (Gray-Box) Architecture**:
1. **Layer 1 (Physics Mechanics):** Infinite slope limit equilibrium equation computes deterministic **Factor of Safety ($\text{FoS}$)** and normal effective stress $\sigma'_n$.
2. **Layer 2 (Feature Pipeline):** Constructs hydro-kinematic feature interactions ($m \times R_{24}$, $v_{\text{tilt}} \times \sin\beta$).
3. **Layer 3 (XGBoost Ensemble):** Gradient-boosted decision tree ensemble learns complex non-linear failure probabilities conditioned on both raw transducer signals and physical stability states.
4. **Layer 4 (SHAP Explainability):** `shap.TreeExplainer` computes exact local feature contributions, attributing directional impact to each physical transducer in real time.

```
┌────────────────────────────────────────────────────────┐
│  Multi-Transducer Telemetry (Moisture, Rain, IMU Tilt) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  Geotechnical Physics Engine (Limit Equilibrium FoS)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  Hydro-Kinematic Feature Pipeline (6-DOF + Physics)   │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│  XGBoost Classifier       │ │  SHAP TreeExplainer      │
│  (Probability Estimation) │ │  (Feature Attributions)  │
└─────────────┬─────────────┘ └───────────┬──────────────┘
              └─────────────┬─────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  Mission Control Feed & Incident Annunciator (JSON/WS) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Synthetic Dataset Generation Methodology

Because historical landslide failure datasets at individual sensor nodes are scarce, a 5,000-sample synthetic dataset was generated using physical bounds:

| Transducer / Parameter | Distribution | Domain | Physical Interpretation |
|---|---|---|---|
| **Slope Angle ($\beta$)** | $\mathcal{N}(28^\circ, 7^\circ)$ | $12^\circ - 55^\circ$ | Mountain hillside inclination |
| **Soil Moisture ($VWC$)** | $\text{Beta}(2.0, 2.5)$ | $5\% - 98\%$ | Volumetric water content |
| **24h Rainfall ($R_{24}$)** | $\text{Exp}(15\text{ mm}) + f(VWC)$ | $0 - 220\text{ mm}$ | Cumulative monsoon rainfall |
| **Rainfall Intensity ($R$)** | $0.6 \cdot R_{24} + \mathcal{N}(0, 10)$ | $0 - 100\%$ | Instantaneous storm intensity |
| **Tilt Creep Rate ($v_{\text{tilt}}$)** | $\text{Exp}(0.015) + f(\beta, VWC, R)$ | $-0.60 \text{ to } +0.60\text{ }^\circ/\text{min}$ | Kinematic slope displacement rate |
| **Factor of Safety ($\text{FoS}$)** | Deterministic Infinite Slope | $0.10 - 5.00$ | Basal shear plane stability ratio |

### Synthetic Ground Truth Labeling:
$$z = 3.5 \cdot (1.15 - \text{FoS}) + 1.8 \cdot \tilde{m} + 1.5 \cdot \tilde{R}_{24} + 1.4 \cdot \tilde{v}_{\text{tilt}} + \epsilon$$
$$P(\text{failure}) = \frac{1}{1 + e^{-z}}$$

---

## 3. Model Architecture & Hyperparameters

- **Framework:** XGBoost 2.1.4 / Scikit-Learn
- **Estimators:** 120 trees
- **Max Depth:** 4
- **Learning Rate:** 0.06
- **Subsample Ratio:** 0.85
- **Colsample by Tree:** 0.85
- **Objective:** `binary:logistic` (`logloss`)

---

## 4. SHAP Feature Attribution Schema

For every incoming telemetry packet, `LandguardShapExplainer` decomposes the model output into directional feature forces:

```json
{
  "risk_score": 78,
  "risk_level": "HIGH",
  "confidence": 0.84,
  "factor_of_safety": 0.94,
  "model_version": "v0.1.0-synthetic-xgb",
  "is_synthetic_demonstration": true,
  "top_factors": [
    {
      "feature": "soil_moisture",
      "display_name": "Soil Moisture",
      "raw_value": 78.4,
      "impact": "positive",
      "contribution": 0.2842
    },
    {
      "feature": "factor_of_safety",
      "display_name": "Factor of Safety (FoS)",
      "raw_value": 0.94,
      "impact": "positive",
      "contribution": 0.2415
    },
    {
      "feature": "rainfall_24h",
      "display_name": "24h Cumulative Precipitation",
      "raw_value": 62.0,
      "impact": "positive",
      "contribution": 0.1870
    },
    {
      "feature": "slope_angle",
      "display_name": "Slope Dip Angle",
      "raw_value": 28.5,
      "impact": "positive",
      "contribution": 0.0820
    }
  ]
}
```

---

## 5. Limitations & Future Real-World Data Roadmap

### Key Limitations:
1. **Planar Slip Assumption:** Does not model deep-seated rotational failure surfaces or complex structural discontinuities (bedding planes, fault zones).
2. **Synthetic Boundary:** Model is tuned to the synthetic logit generator, not real mountain slope geology.

### Roadmap for Operational Deployment:
1. **Geological Survey Calibration:** Integrate core-drilling lithology (cohesion $c'$, friction $\phi'$, hydraulic conductivity $K_{\text{sat}}$).
2. **Historical Ingest:** Ingest regional landslide inventories (GSI - Geological Survey of India, NASA Global Landslide Catalog).
3. **Borehole Instrumentation:** Couple surface ESP32 telemetry with ShapeArray (SAA) depth inclinometers and vibrating wire piezometers.
