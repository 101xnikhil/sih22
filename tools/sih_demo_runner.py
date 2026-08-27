#!/usr/bin/env python3
"""
================================================================================
LANDGUARD AI — SIH 2026 Controlled Demonstration Runner (Phase 17)
================================================================================

Orchestrates the 6-state evaluation suite for SIH judging in 3–5 minutes:
  1. NORMAL: Dry baseline, low moisture, stable slope -> LOW risk
  2. RAIN: Onset precipitation, rain detected -> LOW/MODERATE risk
  3. HEAVY_RAIN: Severe monsoon downpour -> MODERATE risk
  4. SATURATION: High pore-water saturation, FoS degrades -> HIGH risk alert
  5. SLOPE_MOVEMENT: Angular tilt displacement, FoS < 1.0 -> CRITICAL alarm
  6. CRITICAL: Imminent slope collapse -> emergency evacuation alarm

⚠️ DISCLAIMER:
  "Controlled laboratory prototype demonstration / simulation mode"
  Designed for reliable SIH jury evaluation if physical conditions are hard to reproduce.
  Real-world hardware telemetry ingestion mode remains unaltered.
================================================================================
"""

import sys
import os
import time
import json
from datetime import datetime

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from fastapi.testclient import TestClient
from app.main import app
from app.services.demo_service import SIH_DEMO_STATES, DEMO_DISCLAIMER

# ANSI Color Codes
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
ORANGE = "\033[38;5;208m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def print_banner():
    print(f"\n{CYAN}{BOLD}" + "=" * 80 + f"{RESET}")
    print(f"{CYAN}{BOLD}  LANDGUARD AI — SIH 2026 DEMO MODE CONTROLLER (PHASE 17){RESET}")
    print(f"  {DIM}Smart India Hackathon 3–5 Min Controlled Scenario Evaluation Suite{RESET}")
    print(f"{CYAN}{BOLD}" + "=" * 80 + f"{RESET}")
    print(f"\n  {YELLOW}{BOLD}⚠️  DISCLAIMER:{RESET} {YELLOW}{DEMO_DISCLAIMER}{RESET}")
    print(f"  {DIM}Hardware mode remains completely unaltered. Controlled simulation active.{RESET}\n")


def print_state_header(index: int, state_key: str):
    st = SIH_DEMO_STATES[state_key]
    color = GREEN if state_key in ["NORMAL", "RAIN"] else (YELLOW if state_key == "HEAVY_RAIN" else (ORANGE if state_key == "SATURATION" else RED))
    print("\n" + "-" * 80)
    print(f" {color}{BOLD}[STATE {index}/6]: [{st['label']}] — {st['title'].upper()}{RESET}")
    print(f" {DIM}{st['description']}{RESET}")
    print("-" * 80)


def run_sih_demonstration():
    print_banner()
    client = TestClient(app)

    # 1. Verify Demo Status
    status_res = client.get("/api/demo/status")
    if status_res.status_code != 200:
        print(f"{RED}Error connecting to demo API: {status_res.text}{RESET}")
        return

    states_to_run = ["NORMAL", "RAIN", "HEAVY_RAIN", "SATURATION", "SLOPE_MOVEMENT", "CRITICAL"]
    
    for idx, state_key in enumerate(states_to_run, start=1):
        print_state_header(idx, state_key)
        
        # Trigger state transition
        t_start = time.time()
        res = client.post(f"/api/demo/state/{state_key}")
        t_elapsed = (time.time() - t_start) * 1000
        
        if res.status_code != 200:
            print(f"{RED}State [{state_key}] transition failed: {res.text}{RESET}")
            continue

        data = res.json()
        tel = data["telemetry"]
        risk = data["risk"]
        
        # Color based on risk level
        r_level = risk["risk_level"]
        r_color = GREEN if r_level == "LOW" else (YELLOW if r_level == "MODERATE" else (ORANGE if r_level == "HIGH" else RED))
        
        print(f"\n  {BOLD}📥 Simulated Telemetry Frame:{RESET}")
        print(f"   • Volumetric Soil Moisture:  {CYAN}{tel['soil_moisture']:5.1f}%{RESET}")
        print(f"   • Rain Gauge Intensity:      {CYAN}{tel['rainfall']:5.1f}%{RESET} (24h Accum: {tel['rainfall_24h']:.1f} mm)")
        print(f"   • Slope Dip (Tilt Angle):    {CYAN}{tel['tilt_angle']:5.2f}°{RESET}")
        print(f"   • Creep Angular Rate:        {CYAN}{tel['tilt_rate']:+6.4f}°/min{RESET}")
        
        print(f"\n  {BOLD}⚙️  Gray-Box Physics & XGBoost Risk Assessment:{RESET}")
        print(f"   • Factor of Safety (FoS):    {r_color}{BOLD}{risk['factor_of_safety']:.2f}{RESET} {'[STABLE > 1.3]' if risk['factor_of_safety'] > 1.3 else ('[WARNING 1.0-1.3]' if risk['factor_of_safety'] >= 1.0 else '[CRITICAL FAILURE < 1.0]')}")
        print(f"   • Calibrated Hazard Score:   {r_color}{BOLD}{risk['risk_score']*100:.1f}%{RESET}")
        print(f"   • Hazard Categorical Level:  {r_color}{BOLD}{r_level}{RESET}")
        print(f"   • Model Confidence:          {risk['confidence']*100:.0f}%")
        print(f"   • Ingest Latency:            {t_elapsed:.1f} ms")

        # Milestone Events
        print(f"\n  {BOLD}⏱️  Milestone Event Timeline Log:{RESET}")
        for evt in data.get("timeline_events", [])[:4]:
            tag_color = RED if "ALERT" in evt["event"] or "anomaly" in evt["event"] else (ORANGE if "decreased" in evt["event"] else YELLOW)
            print(f"   [{evt['timestamp'][11:19]}] {tag_color}{BOLD}» {evt['event']}{RESET} — {DIM}{evt['description']}{RESET}")

        if data.get("alert"):
            print(f"\n  {RED}{BOLD}🚨 DISPATCHED SYSTEM ALARM:{RESET} {RED}{data['alert']}{RESET}")

        time.sleep(0.8)

    # Final Summary Matrix
    print(f"\n{CYAN}{BOLD}" + "=" * 80 + f"{RESET}")
    print(f"{GREEN}{BOLD}  ✅ SIH DEMONSTRATION LIFECYCLE COMPLETED SUCCESSFULLY!{RESET}")
    print(f"{CYAN}{BOLD}" + "=" * 80 + f"{RESET}")
    print(f"\n  {BOLD}Interactive 6-State Controller Buttons:{RESET}")
    print(f"   [ NORMAL ]         --> {GREEN}{BOLD}LOW RISK{RESET}      (Moisture: 18.5%, Tilt: 21.8°, FoS: 1.85)")
    print(f"   [ RAIN ]           --> {GREEN}{BOLD}LOW/MOD RISK{RESET}  (Moisture: 38.0%, Rain: 35%, FoS: 1.45)")
    print(f"   [ HEAVY RAIN ]     --> {YELLOW}{BOLD}MODERATE RISK{RESET} (Moisture: 58.0%, Rain: 75%, FoS: 1.28)")
    print(f"   [ SATURATION ]     --> {ORANGE}{BOLD}HIGH RISK{RESET}     (Moisture: 84.0%, Rain: 85%, FoS: 1.08) -> Alert")
    print(f"   [ SLOPE MOVEMENT ] --> {RED}{BOLD}CRITICAL RISK{RESET} (Moisture: 91.0%, Tilt: 31.5°, FoS: 0.92) -> Alarm")
    print(f"   [ CRITICAL ]       --> {RED}{BOLD}CRITICAL RISK{RESET} (Moisture: 96.0%, Tilt: 38.4°, FoS: 0.65) -> Evacuation")
    print(f"\n  {YELLOW}{BOLD}DISCLAIMER DISPLAYED:{RESET} {DEMO_DISCLAIMER}\n")


if __name__ == "__main__":
    run_sih_demonstration()
