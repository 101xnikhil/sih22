# LANDGUARD AI — Geotechnical Physics & Risk Engine Specification

> [!WARNING]
> **PROTOTYPE DEMONSTRATION DISCLAIMER**
> The physics and risk estimation models described herein are engineered strictly for **prototype demonstration and architectural validation (SIH 2026)**.
> This system is **NOT a certified or field-validated real-world geotechnical landslide early warning system**. Real-world deployment requires site-specific geological surveys, borehole core sampling, in-situ piezometer calibration, and geotechnical certification. No claims of operational real-world prediction accuracy are made.

---

## 1. Mathematical Formulation

LANDGUARD AI employs a **gray-box hybrid architecture**: a physics-based limit equilibrium model coupled with a multi-transducer feature engineering pipeline, designed to seamlessly accept downstream gradient-boosted decision trees (XGBoost).

### 1.1 Limit Equilibrium Infinite Slope Model

The physics core is based on the classical **Skempton & DeLory (1957)** and **Haefeli (1948)** infinite slope stability equation for translational sliding on planar mountain surfaces.

$$\text{FoS} = \frac{\tau_{\text{resist}}}{\tau_{\text{drive}}} = \frac{c' + \sigma'_n \tan(\phi')}{\gamma_{\text{sat}} \cdot z \cdot \sin(\beta) \cos(\beta)}$$

Where:
- $\text{FoS}$: Factor of Safety ($>1.30$ Stable, $1.00 - 1.30$ Warning, $<1.00$ Failure)
- $c'$: Effective soil cohesion ($\text{kPa}$)
- $\phi'$: Effective internal friction angle ($\text{degrees}$)
- $\beta$: Slope inclination dip angle ($\text{degrees}$)
- $z$: Assumed depth to planar failure slip plane ($\text{meters}$)
- $\gamma_{\text{sat}}$: Saturated unit weight of soil mass ($\text{kN/m}^3$)
- $\gamma_w$: Unit weight of water ($9.81\text{ kN/m}^3$)
- $\sigma'_n$: Effective normal stress on the basal shear plane ($\text{kPa}$)

---

### 1.2 Transient Pore Water Pressure & Shear Strength Degradation

Under heavy monsoon precipitation, pore water pressure rises and weakens soil interlocking bonds. In this prototype, the phreatic surface ratio $m \in [0, 1]$ is parameterized via volumetric soil moisture $VWC$:

$$m = \frac{\text{Soil Moisture (\%)}}{100}$$

$$\sigma'_n = (\gamma_{\text{sat}} - m \cdot \gamma_w) \cdot z \cdot \cos^2(\beta)$$

Furthermore, effective cohesion and friction angle degrade as saturation approaches $100\%$:

$$c'(m) = c_{\text{base}} \cdot (1 - \alpha_c \cdot m)$$
$$\phi'(m) = \phi_{\text{base}} \cdot (1 - \alpha_\phi \cdot m)$$

Where $\alpha_c = 0.35$ and $\alpha_\phi = 0.35$ represent maximum geotechnical parameter reductions.

---

## 2. Configurable Prototype Parameters

All geotechnical constants are fully configurable in `backend/app/services/risk_engine/config.py`:

| Parameter | Symbol | Default Value | Unit | Description |
|---|---|---|---|---|
| Baseline Cohesion | $c_{\text{base}}$ | `6.5` | $\text{kPa}$ | Colluvial soil baseline cohesion |
| Baseline Friction Angle | $\phi_{\text{base}}$ | `28.0` | $\text{deg}$ | Internal shear angle of unsaturated soil |
| Saturated Soil Unit Weight | $\gamma_{\text{sat}}$ | `18.5` | $\text{kN/m}^3$ | Bulk unit weight of saturated soil |
| Water Unit Weight | $\gamma_w$ | `9.81` | $\text{kN/m}^3$ | Density of groundwater |
| Basal Slip Plane Depth | $z$ | `1.5` | $\text{m}$ | Failure shear plane depth |
| Cohesion Degradation Factor | $\alpha_c$ | `0.35` | ratio | Fraction reduction at $100\%$ saturation |
| Friction Degradation Factor | $\alpha_\phi$ | `0.35` | ratio | Fraction reduction at $100\%$ saturation |

---

## 3. Gray-Box Risk Scoring & Hazard Tiers

The physics output ($\text{FoS}$) is combined with normalized kinematic and precipitation features:

$$\text{Risk} = w_{\text{moist}} \cdot \tilde{m} + w_{\text{rain}} \cdot \tilde{R}_{24} + w_{\text{fos}} \cdot \tilde{\text{FoS}} + w_{\text{tilt}} \cdot \tilde{\beta} + w_{\text{rate}} \cdot \tilde{v}_{\text{tilt}} + w_{\text{int}} \cdot (\tilde{m} \cdot \tilde{R}_{24})$$

### Hazard Tier Boundaries:

```
0.00 ──────── 0.25 ──────── 0.50 ──────── 0.75 ──────── 1.00
       LOW          MODERATE         HIGH         CRITICAL
  (FoS >= 1.45)   (FoS < 1.45)   (FoS < 1.20)   (FoS <= 1.00)
```

- **LOW ($<0.25$)**: Normal baseline conditions; nominal safety margins.
- **MODERATE ($0.25 - 0.50$)**: Elevated pore water pressure or steady precipitation; advisory monitoring.
- **HIGH ($0.50 - 0.75$)**: Severe soil saturation ($>75\%$) and displacement onset; warning active.
- **CRITICAL ($\ge 0.75$ or $\text{FoS} < 1.00$)**: Limit equilibrium failure boundary crossed; active slope failure.

---

## 4. Downstream Machine Learning (XGBoost) Integration

The `FeatureEngineeringPipeline` (`features.py`) extracts a standardized numerical feature vector:

```python
{
    "soil_moisture_pct": 74.5,
    "rainfall_pct": 60.0,
    "rainfall_24h_mm": 52.0,
    "slope_angle_deg": 28.5,
    "tilt_rate_deg_min": 0.045,
    "factor_of_safety": 0.98,
    "fos_vulnerability_index": 0.885,
    "moisture_norm": 0.793,
    "rain_24h_norm": 0.650,
    "moisture_rain_interaction": 0.515,
    "creep_kinematic_index": 0.214
}
```

This feature vector can be passed directly to a pre-trained XGBoost classifier via:
```python
risk_engine.register_ml_model(trained_xgboost_model)
```

---

## 5. Explainable AI (SHAP) Attribution

Every assessment produces signed, directional feature attributions indicating how much each physical measurement pushed the risk probability score up ($+\Delta p$) or down ($-\Delta p$), rendered live on the command dashboard.
