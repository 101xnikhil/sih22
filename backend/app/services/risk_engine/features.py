from typing import Dict, Any, List, Optional
import math


class FeatureEngineeringPipeline:
    """
    Constructs unified geotechnical and kinematic feature vectors 
    combining raw physical transducer readings with physics-derived stability variables.
    
    This feature representation serves both the internal gray-box heuristic pipeline 
    and downstream machine learning models (e.g. XGBoost, Random Forest).
    """

    @staticmethod
    def extract_features(
        soil_moisture_pct: float,
        rainfall_pct: float,
        rainfall_24h_mm: float,
        slope_angle_deg: float,
        tilt_rate_deg_min: float,
        factor_of_safety: float,
        historical_readings: Optional[List[Dict[str, float]]] = None,
    ) -> Dict[str, float]:
        """
        Extracts structured feature vector from multi-modal sensor inputs and physics outputs.
        """
        # 1. Normalized Base Sensors
        m_pct = max(0.0, min(100.0, float(soil_moisture_pct)))
        r_pct = max(0.0, min(100.0, float(rainfall_pct)))
        r24_mm = max(0.0, float(rainfall_24h_mm))
        tilt_deg = max(0.0, min(85.0, float(slope_angle_deg)))
        rate_deg_min = float(tilt_rate_deg_min)

        moisture_norm = max(0.0, min(1.0, (m_pct - 15.0) / 75.0))
        rain_24h_norm = max(0.0, min(1.0, r24_mm / 80.0))
        rain_rate_norm = max(0.0, min(1.0, r_pct / 100.0))
        tilt_norm = max(0.0, min(1.0, max(0.0, tilt_deg - 20.0) / 30.0))
        tilt_rate_norm = max(0.0, min(1.0, abs(rate_deg_min) / 0.10))

        # 2. Physics-Informed Geotechnical Features
        # FoS vulnerability index: normalized between 0.0 (FoS >= 1.6, very safe) and 1.0 (FoS <= 0.9, failure)
        fos_vulnerability = max(0.0, min(1.0, (1.6 - factor_of_safety) / 0.7))

        # 3. Cross-Domain Interaction Features (Hydro-Mechanical Coupling)
        moisture_rain_interaction = moisture_norm * rain_24h_norm
        moisture_tilt_coupling = moisture_norm * math.sin(math.radians(tilt_deg))
        
        # Kinematic energy proxy: kinetic creep velocity coupled with gravitational slope component
        creep_kinematic_index = (abs(rate_deg_min) * 10.0) * math.sin(math.radians(tilt_deg))

        # 4. Optional Historical Trend Features
        moisture_delta_1h = 0.0
        if historical_readings and len(historical_readings) >= 2:
            prev_moisture = historical_readings[0].get("soil_moisture", m_pct)
            moisture_delta_1h = m_pct - prev_moisture

        return {
            # Raw Physical Measurements
            "soil_moisture_pct": round(m_pct, 2),
            "rainfall_pct": round(r_pct, 2),
            "rainfall_24h_mm": round(r24_mm, 2),
            "slope_angle_deg": round(tilt_deg, 2),
            "tilt_rate_deg_min": round(rate_deg_min, 4),
            
            # Physics-Derived Geotechnical Variables
            "factor_of_safety": round(factor_of_safety, 2),
            "fos_vulnerability_index": round(fos_vulnerability, 4),
            
            # Normalized Hydro-Kinematic Features
            "moisture_norm": round(moisture_norm, 4),
            "rain_24h_norm": round(rain_24h_norm, 4),
            "rain_rate_norm": round(rain_rate_norm, 4),
            "tilt_norm": round(tilt_norm, 4),
            "tilt_rate_norm": round(tilt_rate_norm, 4),
            
            # Interaction & Coupled Proxies
            "moisture_rain_interaction": round(moisture_rain_interaction, 4),
            "moisture_tilt_coupling": round(moisture_tilt_coupling, 4),
            "creep_kinematic_index": round(creep_kinematic_index, 4),
            "moisture_delta_1h": round(moisture_delta_1h, 2),
        }


feature_pipeline = FeatureEngineeringPipeline()
