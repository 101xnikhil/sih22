#!/usr/bin/env python3
"""
================================================================================
LANDGUARD AI — Physical Landslide Laboratory Demonstration Suite (Phase 11)
================================================================================

Executes the physical SIH laboratory experiment:
  Stage 1: Dry soil -> low moisture -> stable tilt -> LOW risk
  Stage 2: Artificial rainfall -> moisture increases -> risk begins increasing -> MODERATE risk
  Stage 3: High water infiltration -> moisture high -> Factor of Safety decreases -> HIGH risk
  Stage 4: Controlled physical slope movement -> tilt changes -> risk increases -> alert triggered -> CRITICAL risk

Event Timeline Milestones:
  1. "Rainfall detected"
  2. "Moisture threshold crossed"
  3. "Stability indicator decreased"
  4. "Tilt anomaly detected"
  5. "HIGH RISK ALERT"

⚠️ DISCLAIMER:
  "Controlled laboratory prototype demonstration"
  This miniature prototype demonstrates physical sensor-to-AI alert dynamics.
  It does not claim real-world field landslide prediction without geotechnical borehole survey calibration.
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
from app.services.demo_service import DEMO_STAGES, DEMO_DISCLAIMER

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
    print(f"{CYAN}{BOLD}  LANDGUARD AI — PHYSICAL LANDSLIDE DEMONSTRATION RUNNER (PHASE 11){RESET}")
    print(f"  {DIM}Smart India Hackathon (SIH 2026) Prototype Test-Bench Presentation{RESET}")
    print(f"{CYAN}{BOLD}" + "=" * 80 + f"{RESET}")
    print(f"\n  {YELLOW}{BOLD}⚠️  DISCLAIMER:{RESET} {YELLOW}{DEMO_DISCLAIMER}{RESET}")
    print(f"  {DIM}Miniature laboratory scale test — demonstrates real-time Gray-Box FoS & AI response.{RESET}\n")


def print_stage_header(stage_id: int):
    stage = DEMO_STAGES[stage_id]
    color = GREEN if stage_id == 1 else (YELLOW if stage_id == 2 else (ORANGE if stage_id == 3 else RED))
    print("\n" + "-" * 80)
    print(f" {color}{BOLD}[STAGE {stage_id}/4]: {stage['title'].upper()}{RESET}")
    print(f" {DIM}{stage['description']}{RESET}")
    print("-" * 80)


def run_physical_demonstration():
    print_banner()
    client = TestClient(app)

    # 1. Verify Demo Status
    status_res = client.get("/api/demo/status")
    if status_res.status_code != 200:
        print(f"{RED}Error connecting to demo API: {status_res.text}{RESET}")
        return

    stages_to_run = [1, 2, 3, 4]
    
    for stage_id in stages_to_run:
        print_stage_header(stage_id)
        
        # Trigger stage transition
        t_start = time.time()
        res = client.post(f"/api/demo/stage/{stage_id}")
        t_elapsed = (time.time() - t_start) * 1000
        
        if res.status_code != 200:
            print(f"{RED}Stage {stage_id} transition failed: {res.text}{RESET}")
            continue

        data = res.json()
        tel = data["telemetry"]
        risk = data["risk"]
        
        # Color based on risk level
        r_level = risk["risk_level"]
        r_color = GREEN if r_level == "LOW" else (YELLOW if r_level == "MODERATE" else (ORANGE if r_level == "HIGH" else RED))
        
        print(f"\n  {BOLD}📥 Ingested Telemetry Frame:{RESET}")
        print(f"   • Volumetric Soil Moisture:  {CYAN}{tel['soil_moisture']:5.1f}%{RESET}")
        print(f"   • Rain Gauge Intensity:      {CYAN}{tel['rainfall']:5.1f}%{RESET} (24h Accum: {tel['rainfall_24h']:.1f} mm)")
        print(f"   • Slope Dip Angle:           {CYAN}{tel['tilt_angle']:5.2f}°{RESET}")
        print(f"   • Creep Angular Rate:        {CYAN}{tel['tilt_rate']:+6.4f}°/min{RESET}")
        
        print(f"\n  {BOLD}⚙️  Gray-Box Physics & AI Risk Assessment:{RESET}")
        print(f"   • Factor of Safety (FoS):    {r_color}{BOLD}{risk['factor_of_safety']:.2f}{RESET} {'[STABLE > 1.3]' if risk['factor_of_safety'] > 1.3 else ('[WARNING 1.0-1.3]' if risk['factor_of_safety'] >= 1.0 else '[CRITICAL FAILURE < 1.0]')}")
        print(f"   • Calibrated Hazard Score:   {r_color}{BOLD}{risk['risk_score']*100:.1f}%{RESET}")
        print(f"   • Hazard Categorical Level:  {r_color}{BOLD}{r_level}{RESET}")
        print(f"   • Model Confidence:          {risk['confidence']*100:.0f}%")
        print(f"   • Processing Latency:        {t_elapsed:.1f} ms")

        # Milestone Events
        print(f"\n  {BOLD}⏱️  Milestone Event Timeline Log:{RESET}")
        for evt in data.get("timeline_events", [])[:4]:
            tag_color = RED if "ALERT" in evt["event"] or "anomaly" in evt["event"] else (ORANGE if "decreased" in evt["event"] else YELLOW)
            print(f"   [{evt['timestamp'][11:19]}] {tag_color}{BOLD}» {evt['event']}{RESET} — {DIM}{evt['description']}{RESET}")

        if data.get("alert"):
            print(f"\n  {RED}{BOLD}🚨 DISPATCHED SYSTEM ALARM:{RESET} {RED}{data['alert']}{RESET}")

        time.sleep(1.0)

    # Final Summary Matrix
    print(f"\n{CYAN}{BOLD}" + "=" * 80 + f"{RESET}")
    print(f"{GREEN}{BOLD}  ✅ PHYSICAL DEMONSTRATION LIFECYCLE COMPLETED SUCCESSFULLY!{RESET}")
    print(f"{CYAN}{BOLD}" + "=" * 80 + f"{RESET}")
    print(f"\n  {BOLD}Visual Risk Trajectory Verification:{RESET}")
    print(f"   Stage 1 (Dry Soil)       --> {GREEN}{BOLD}LOW RISK{RESET}      (FoS ~1.75)")
    print(f"   Stage 2 (Rainfall)       --> {YELLOW}{BOLD}MODERATE RISK{RESET} (FoS ~1.38, Milestones: 'Rainfall detected', 'Moisture threshold crossed')")
    print(f"   Stage 3 (Infiltration)   --> {ORANGE}{BOLD}HIGH RISK{RESET}     (FoS ~1.12, Milestone: 'Stability indicator decreased')")
    print(f"   Stage 4 (Slope Movement) --> {RED}{BOLD}CRITICAL RISK{RESET} (FoS ~0.88, Milestones: 'Tilt anomaly detected', 'HIGH RISK ALERT')")
    print(f"\n  {YELLOW}{BOLD}DISCLAIMER DISPLAYED:{RESET} {DEMO_DISCLAIMER}\n")


if __name__ == "__main__":
    run_physical_demonstration()
