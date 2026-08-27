from app.services.risk_engine import risk_engine

print("=" * 105)
print("LANDGUARD AI — Geotechnical Physics Risk Engine Verification Matrix")
print("=" * 105)

scenarios = [
    ("1. Baseline Normal (Dry)", 18.0, 0.0, 0.0, 20.0, 0.0),
    ("2. Light Rain Onset", 35.0, 20.0, 10.0, 20.5, 0.002),
    ("3. Moderate Rain Event", 55.0, 45.0, 35.0, 22.0, 0.010),
    ("4. Heavy Monsoon Rain", 75.0, 75.0, 65.0, 26.0, 0.035),
    ("5. Saturated Slope Creep", 88.0, 90.0, 95.0, 34.0, 0.120),
    ("6. Imminent Slope Failure (Crisis)", 96.0, 95.0, 140.0, 42.0, 0.350),
]

print(f"{'#':<3} | {'Scenario Description':<35} | {'Moist%':<6} | {'Rain24h':<7} | {'Tilt':<5} | {'Rate/m':<7} | {'FoS':<5} | {'Risk Score':<10} | {'Risk Level':<8}")
print("-" * 105)

for idx, (name, m, r, r24, tilt, rate) in enumerate(scenarios, 1):
    res = risk_engine.evaluate(
        soil_moisture_pct=m,
        rainfall_pct=r,
        rainfall_24h_mm=r24,
        slope_angle_deg=tilt,
        tilt_rate_deg_min=rate,
    )
    score_pct = res["risk_score"] * 100.0
    fos = res["factor_of_safety"]
    level = res["risk_level"]
    print(f"{idx:<3} | {name:<35} | {m:<6.1f} | {r24:<7.1f} | {tilt:<5.1f} | {rate:<7.3f} | {fos:>4.2f} | {score_pct:>9.1f}% | {level}")

print("=" * 105)
