from pydantic import BaseModel, Field
from typing import Dict


class GeotechnicalConfig(BaseModel):
    """
    Configurable geotechnical parameters for the simplified infinite slope model.
    Default values represent typical unsaturated-to-saturated colluvium / residual soil on mountain slopes.
    """
    # Baseline Effective Soil Shear Strength Parameters
    cohesion_kpa: float = Field(
        default=6.5,
        ge=0.0,
        le=50.0,
        description="Effective cohesion c' of unsaturated soil mass in kPa"
    )
    friction_angle_deg: float = Field(
        default=28.0,
        ge=5.0,
        le=50.0,
        description="Internal angle of friction φ' of dry/unsaturated soil in degrees"
    )
    
    # Soil Mass & Hydraulic Properties
    gamma_sat_kn_m3: float = Field(
        default=18.5,
        ge=12.0,
        le=25.0,
        description="Saturated unit weight of soil mass γ_sat in kN/m³"
    )
    gamma_w_kn_m3: float = Field(
        default=9.81,
        description="Unit weight of water γ_w in kN/m³"
    )
    slip_depth_m: float = Field(
        default=1.5,
        ge=0.2,
        le=10.0,
        description="Assumed depth to potential planar shear failure plane z in meters"
    )

    # Parametric Saturation Degradation Coefficients
    cohesion_degradation_factor: float = Field(
        default=0.35,
        ge=0.0,
        le=0.80,
        description="Maximum fractional reduction of cohesion at 100% saturation (c_sat = c_base * (1 - factor))"
    )
    friction_degradation_factor: float = Field(
        default=0.35,
        ge=0.0,
        le=0.80,
        description="Maximum fractional reduction of friction angle at 100% saturation (φ_sat = φ_base * (1 - factor))"
    )


class RiskThresholdConfig(BaseModel):
    """Configurable categorical hazard classification boundaries."""
    fos_critical_limit: float = Field(default=1.00, description="FoS <= 1.0 indicates critical limit equilibrium failure")
    fos_high_limit: float = Field(default=1.20, description="FoS <= 1.20 indicates high vulnerability warning")
    fos_moderate_limit: float = Field(default=1.45, description="FoS <= 1.45 indicates moderate advisory stage")
    
    score_critical_limit: float = Field(default=0.75, description="Hazard score >= 0.75 triggers CRITICAL tier")
    score_high_limit: float = Field(default=0.50, description="Hazard score >= 0.50 triggers HIGH tier")
    score_moderate_limit: float = Field(default=0.25, description="Hazard score >= 0.25 triggers MODERATE tier")


class RiskEngineConfig(BaseModel):
    """Master configuration for the LANDGUARD AI gray-box risk pipeline."""
    model_name: str = "LANDGUARD-GrayBox-InfiniteSlope"
    model_version: str = "v0.2.0-prototype"
    geotechnical: GeotechnicalConfig = Field(default_factory=GeotechnicalConfig)
    thresholds: RiskThresholdConfig = Field(default_factory=RiskThresholdConfig)
    
    # Feature Weightings for Hybrid Gray-Box Scoring
    weights: Dict[str, float] = Field(
        default={
            "soil_moisture": 0.24,
            "rainfall_24h": 0.20,
            "factor_of_safety": 0.24,
            "tilt_angle": 0.12,
            "rainfall_rate": 0.08,
            "tilt_rate": 0.07,
            "interaction_moisture_rain": 0.05,
        }
    )


default_config = RiskEngineConfig()
