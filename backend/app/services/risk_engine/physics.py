import math
from typing import Dict, Any, Optional
from app.services.risk_engine.config import GeotechnicalConfig


class GeotechnicalPhysicsEngine:
    """
    Simplified limit equilibrium infinite slope stability solver.
    
    Mathematical Formulation:
    Based on the classical Skempton & DeLory (1957) / Haefeli (1948) infinite slope 
    model with 1D planar seepage and moisture-dependent shear strength degradation.

    Assumptions & Boundary Conditions:
    1. Planar failure surface parallel to ground surface at depth z.
    2. Infinite lateral extent (neglecting lateral edge boundary resistance).
    3. Transient pore water pressure is parameterized via saturation ratio m = moisture / 100.
    4. Effective shear parameters (c', φ') degrade linearly with increasing saturation.
    """

    def __init__(self, config: Optional[GeotechnicalConfig] = None):
        self.config = config or GeotechnicalConfig()

    def compute_factor_of_safety(
        self,
        soil_moisture_pct: float,
        slope_angle_deg: float,
    ) -> float:
        """
        Calculates the Factor of Safety (FoS) ratio against translational shear sliding.

        Parameters:
        - soil_moisture_pct: Calibrated volumetric soil water content (0.0 to 100.0 %)
        - slope_angle_deg: Ground surface inclination / dip angle (0.0 to 85.0 °)

        Returns:
        - Factor of Safety (FoS):
          FoS > 1.30: Stable equilibrium
          1.00 <= FoS <= 1.30: Warning / Metastable state
          FoS < 1.00: Limit equilibrium failure (active sliding)
        """
        # Clamp inputs to safe physical domains
        beta_deg = max(1.0, min(85.0, float(slope_angle_deg)))
        beta = math.radians(beta_deg)

        # Volumetric saturation ratio m ∈ [0.0, 1.0]
        m = max(0.0, min(100.0, float(soil_moisture_pct))) / 100.0

        # Parametric degradation of soil cohesion and friction angle
        c_deg = 1.0 - self.config.cohesion_degradation_factor * m
        phi_deg = 1.0 - self.config.friction_degradation_factor * m

        c_effective = max(0.1, self.config.cohesion_kpa * c_deg)
        phi_effective_deg = max(2.0, self.config.friction_angle_deg * phi_deg)
        phi_effective = math.radians(phi_effective_deg)

        # Geometrical terms
        cos_beta = math.cos(beta)
        sin_beta = math.sin(beta)
        cos2_beta = cos_beta ** 2

        # Effective normal stress on the basal slip plane: σ'_n = (γ_sat - m * γ_w) * z * cos²(β)
        sigma_eff = (self.config.gamma_sat_kn_m3 - m * self.config.gamma_w_kn_m3) * self.config.slip_depth_m * cos2_beta
        sigma_eff = max(0.0, sigma_eff)

        # Available shear strength (Mohr-Coulomb criterion): τ_resist = c' + σ'_n * tan(φ')
        tau_resist = c_effective + sigma_eff * math.tan(phi_effective)

        # Mobilized downslope shear stress: τ_drive = γ_sat * z * sin(β) * cos(β)
        tau_drive = self.config.gamma_sat_kn_m3 * self.config.slip_depth_m * sin_beta * cos_beta

        if tau_drive <= 0.0001:
            return 5.0

        fos = tau_resist / tau_drive
        return max(0.1, min(5.0, round(fos, 2)))

    def compute_stability_metrics(
        self,
        soil_moisture_pct: float,
        slope_angle_deg: float,
    ) -> Dict[str, Any]:
        """
        Computes detailed geotechnical intermediate variables for diagnostics & explainability.
        """
        beta_deg = max(1.0, min(85.0, float(slope_angle_deg)))
        beta = math.radians(beta_deg)
        m = max(0.0, min(100.0, float(soil_moisture_pct))) / 100.0

        c_effective = self.config.cohesion_kpa * (1.0 - self.config.cohesion_degradation_factor * m)
        phi_effective_deg = self.config.friction_angle_deg * (1.0 - self.config.friction_degradation_factor * m)
        phi_effective = math.radians(phi_effective_deg)

        cos_beta = math.cos(beta)
        sin_beta = math.sin(beta)
        cos2_beta = cos_beta ** 2

        sigma_eff = (self.config.gamma_sat_kn_m3 - m * self.config.gamma_w_kn_m3) * self.config.slip_depth_m * cos2_beta
        tau_resist = c_effective + max(0.0, sigma_eff) * math.tan(phi_effective)
        tau_drive = self.config.gamma_sat_kn_m3 * self.config.slip_depth_m * sin_beta * cos_beta

        fos = tau_resist / max(0.0001, tau_drive)
        fos_clamped = max(0.1, min(5.0, round(fos, 2)))

        return {
            "factor_of_safety": fos_clamped,
            "effective_cohesion_kpa": round(c_effective, 2),
            "effective_friction_deg": round(phi_effective_deg, 2),
            "effective_normal_stress_kpa": round(sigma_eff, 2),
            "resisting_shear_stress_kpa": round(tau_resist, 2),
            "driving_shear_stress_kpa": round(tau_drive, 2),
            "pore_pressure_ratio_m": round(m, 3),
            "is_equilibrium_failure": fos_clamped < 1.0,
        }
