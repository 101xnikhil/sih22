import os
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any

from app.services.risk_engine.physics import GeotechnicalPhysicsEngine
from app.services.risk_engine.config import GeotechnicalConfig


def generate_synthetic_landslide_dataset(
    num_samples: int = 5000,
    random_seed: int = 42,
    output_path: str = "ml/models/synthetic_dataset.csv",
) -> pd.DataFrame:
    """
    Generates a synthetic demonstration dataset for training a prototype XGBoost model.
    
    WARNING:
    This dataset is synthetically derived using limit equilibrium physics and 
    stochastic noise for architectural validation. It is NOT real-world historical field data.
    """
    np.random.seed(random_seed)
    physics = GeotechnicalPhysicsEngine(GeotechnicalConfig())

    # Sample realistic environmental & kinematic distributions
    # 1. Slope Angle: Mountain slopes typically range from 15° to 50°
    slope_angles = np.clip(np.random.normal(loc=28.0, scale=7.0, size=num_samples), 12.0, 55.0)

    # 2. Soil Moisture: 10% (bone dry) to 98% (full saturation)
    # Use beta distribution to model bimodal dry season vs heavy monsoon events
    moisture_raw = np.random.beta(a=2.0, b=2.5, size=num_samples)
    soil_moisture = np.clip(moisture_raw * 90.0 + 8.0, 5.0, 98.0)

    # 3. Rainfall & 24h Precipitation: correlated with soil moisture
    rain_noise = np.random.exponential(scale=15.0, size=num_samples)
    rainfall_24h = np.clip((soil_moisture / 100.0) * 80.0 + rain_noise, 0.0, 220.0)
    rainfall_intensity = np.clip(rainfall_24h * 0.6 + np.random.normal(0, 10, num_samples), 0.0, 100.0)

    # 4. Tilt Displacement Rate: nominally near 0, accelerating under high moisture/rain and steep slope
    creep_propensity = (soil_moisture / 100.0) * (rainfall_24h / 100.0) * (slope_angles / 45.0)
    tilt_rate = np.clip(np.random.exponential(scale=0.015, size=num_samples) + creep_propensity * 0.15, 0.0, 0.60)
    # Add random sign for minor sensory drift
    tilt_rate = tilt_rate * np.random.choice([1.0, -1.0], p=[0.85, 0.15], size=num_samples)

    # 5. Physics Limit Equilibrium: Compute Factor of Safety (FoS) for every sample
    fos_list = []
    for m, beta in zip(soil_moisture, slope_angles):
        fos = physics.compute_factor_of_safety(soil_moisture_pct=m, slope_angle_deg=beta)
        fos_list.append(fos)
    fos_arr = np.array(fos_list)

    # 6. Synthesize Ground Truth Risk Target (0 = Stable, 1 = Active Hazard/Failure)
    # Hydro-mechanical probability logit
    fos_term = (1.15 - fos_arr) * 3.5
    moist_term = ((soil_moisture - 50.0) / 40.0) * 1.8
    rain_term = (rainfall_24h / 80.0) * 1.5
    tilt_term = (np.abs(tilt_rate) / 0.08) * 1.4
    noise = np.random.normal(0, 0.35, size=num_samples)

    logits = fos_term + moist_term + rain_term + tilt_term + noise
    probabilities = 1.0 / (1.0 + np.exp(-logits))

    # Binary hazard threshold (0 = Stable, 1 = Hazard Triggered)
    binary_labels = (probabilities >= 0.50).astype(int)

    # Categorical Risk Tiers
    risk_tiers = []
    for p, f in zip(probabilities, fos_arr):
        if p >= 0.75 or f < 1.00:
            risk_tiers.append("CRITICAL")
        elif p >= 0.50 or f < 1.20:
            risk_tiers.append("HIGH")
        elif p >= 0.25 or f < 1.45:
            risk_tiers.append("MODERATE")
        else:
            risk_tiers.append("LOW")

    df = pd.DataFrame({
        "soil_moisture": np.round(soil_moisture, 2),
        "rainfall": np.round(rainfall_intensity, 2),
        "rainfall_24h": np.round(rainfall_24h, 2),
        "slope_angle": np.round(slope_angles, 2),
        "tilt_rate": np.round(tilt_rate, 4),
        "factor_of_safety": np.round(fos_arr, 2),
        "synthetic_risk_probability": np.round(probabilities, 4),
        "hazard_label": binary_labels,
        "hazard_tier": risk_tiers,
    })

    # Save to disk
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated synthetic dataset: {len(df)} samples saved to {output_path}")
    print(f"Class distribution: {df['hazard_label'].value_counts().to_dict()}")
    print(f"Tier distribution: {df['hazard_tier'].value_counts().to_dict()}")

    return df


if __name__ == "__main__":
    generate_synthetic_landslide_dataset()
