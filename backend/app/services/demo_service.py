"""
LANDGUARD AI — SIH Demonstration Controller & Laboratory Simulation Service (Phases 11 & 17)

Orchestrates controlled 6-state SIH judging demonstration:
- NORMAL: Dry stable soil -> low moisture -> stable tilt -> LOW risk
- RAIN: Ingress of precipitation -> light showers -> moisture rising -> LOW/MODERATE risk
- HEAVY_RAIN: Severe monsoon downpour -> moisture threshold crossed -> MODERATE risk
- SATURATION: Pore-water saturation -> FoS declines -> HIGH risk alert
- SLOPE_MOVEMENT: Active shear strain -> tilt increases -> FoS < 1.0 -> CRITICAL alarm
- CRITICAL: Structural slope failure -> emergency evacuation siren active

⚠️ Controlled laboratory demonstration / simulation mode for SIH judging.
Does not alter or degrade the physical hardware pipeline.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import asyncio
import logging
import math
import random

from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.schemas.telemetry import TelemetryCreate
from app.services.telemetry_service import telemetry_service
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("landguard.demo")


DEMO_DISCLAIMER = "Controlled SIH prototype demonstration / simulation mode"


# ─── 6 Controllable SIH Demo States (Phase 17) ──────────────────────────────────
SIH_DEMO_STATES: Dict[str, Dict[str, Any]] = {
    "NORMAL": {
        "key": "NORMAL",
        "label": "NORMAL",
        "title": "State 1: Normal Baseline",
        "description": "Baseline dry soil with minimal moisture and nominal slope angle. Risk is LOW.",
        "moisture_pct": 18.5,
        "rainfall_pct": 0.0,
        "rainfall_24h_mm": 0.0,
        "tilt_deg": 21.8,
        "tilt_rate_deg_min": 0.000,
        "risk_level": "LOW",
        "expected_fos": 1.85,
        "rain_detected": False,
        "milestone": "Normal baseline monitoring active",
    },
    "RAIN": {
        "key": "RAIN",
        "label": "RAIN",
        "title": "State 2: Rainfall",
        "description": "Precipitation commences; soil matrix begins moisture absorption.",
        "moisture_pct": 38.0,
        "rainfall_pct": 35.0,
        "rainfall_24h_mm": 18.0,
        "tilt_deg": 22.1,
        "tilt_rate_deg_min": 0.002,
        "risk_level": "LOW",
        "expected_fos": 1.45,
        "rain_detected": True,
        "milestone": "Rainfall detected",
    },
    "HEAVY_RAIN": {
        "key": "HEAVY_RAIN",
        "label": "HEAVY RAIN",
        "title": "State 3: Heavy Rain",
        "description": "Heavy monsoon downpour; soil moisture threshold crossed.",
        "moisture_pct": 58.0,
        "rainfall_pct": 75.0,
        "rainfall_24h_mm": 55.0,
        "tilt_deg": 22.8,
        "tilt_rate_deg_min": 0.008,
        "risk_level": "MODERATE",
        "expected_fos": 1.28,
        "rain_detected": True,
        "milestone": "Moisture threshold crossed",
    },
    "SATURATION": {
        "key": "SATURATION",
        "label": "SATURATION",
        "title": "State 4: Saturation",
        "description": "Extensive moisture saturation and pore-water pressure increase; Factor of Safety declines.",
        "moisture_pct": 84.0,
        "rainfall_pct": 85.0,
        "rainfall_24h_mm": 85.0,
        "tilt_deg": 25.2,
        "tilt_rate_deg_min": 0.038,
        "risk_level": "HIGH",
        "expected_fos": 1.08,
        "rain_detected": True,
        "milestone": "Stability indicator decreased",
    },
    "SLOPE_MOVEMENT": {
        "key": "SLOPE_MOVEMENT",
        "label": "SLOPE MOVEMENT",
        "title": "State 5: Slope Movement",
        "description": "Physical slope movement initiated; angular tilt shifts and shear strain accelerates.",
        "moisture_pct": 91.0,
        "rainfall_pct": 80.0,
        "rainfall_24h_mm": 95.0,
        "tilt_deg": 31.5,
        "tilt_rate_deg_min": 0.160,
        "risk_level": "CRITICAL",
        "expected_fos": 0.92,
        "rain_detected": True,
        "milestone": "Tilt anomaly detected",
    },
    "CRITICAL": {
        "key": "CRITICAL",
        "label": "CRITICAL",
        "title": "State 6: Critical Failure",
        "description": "Severe structural displacement; limit equilibrium failure; emergency alarm triggered.",
        "moisture_pct": 96.0,
        "rainfall_pct": 92.0,
        "rainfall_24h_mm": 115.0,
        "tilt_deg": 38.4,
        "tilt_rate_deg_min": 0.350,
        "risk_level": "CRITICAL",
        "expected_fos": 0.65,
        "rain_detected": True,
        "milestone": "HIGH RISK ALERT",
    },
}

# 4-stage laboratory mappings (Phase 11 legacy support)
DEMO_STAGES: Dict[int, Dict[str, Any]] = {
    1: {**SIH_DEMO_STATES["NORMAL"], "stage_id": 1, "name": "Dry Soil Baseline"},
    2: {**SIH_DEMO_STATES["HEAVY_RAIN"], "stage_id": 2, "name": "Artificial Rainfall Ingress", "milestones": ["Rainfall detected", "Moisture threshold crossed"]},
    3: {**SIH_DEMO_STATES["SATURATION"], "stage_id": 3, "name": "High Water Infiltration", "milestones": ["Stability indicator decreased"]},
    4: {**SIH_DEMO_STATES["SLOPE_MOVEMENT"], "stage_id": 4, "name": "Controlled Physical Slope Movement", "milestones": ["Tilt anomaly detected", "HIGH RISK ALERT"]},
}


class PhysicalDemoService:
    def __init__(self, node_id: str = settings.DEFAULT_NODE_ID):
        self.node_id = node_id
        self.current_stage: int = 1
        self.current_sih_state: str = "NORMAL"
        self.is_running_auto: bool = False
        self.seq_num: int = 2000
        self.timeline_events: List[Dict[str, Any]] = []
        self._init_timeline()

    def _init_timeline(self):
        """Initializes the baseline timeline state."""
        now = datetime.utcnow()
        self.timeline_events = [
            {
                "id": "evt-demo-init",
                "timestamp": now.isoformat(),
                "event": "Laboratory experiment session initialized",
                "stage": 1,
                "status": "completed",
                "risk_level": "LOW",
                "description": "Dry soil baseline verified. Sensors nominal.",
                "disclaimer": DEMO_DISCLAIMER,
            }
        ]

    def get_status(self) -> Dict[str, Any]:
        """Returns the current state of the physical demonstration."""
        stage_info = DEMO_STAGES.get(self.current_stage, DEMO_STAGES[1])
        sih_state_info = SIH_DEMO_STATES.get(self.current_sih_state, SIH_DEMO_STATES["NORMAL"])
        return {
            "demo_mode": settings.DEMO_MODE,
            "disclaimer": DEMO_DISCLAIMER,
            "honest_prototype_notice": "This laboratory demonstration uses a controlled simulation test-bed. It demonstrates algorithm responsiveness and early warning transitions but does not validate real-world slope stability without borehole surveys.",
            "current_stage": self.current_stage,
            "current_sih_state": self.current_sih_state,
            "stage_name": sih_state_info["title"],
            "stage_info": stage_info,
            "sih_state_info": sih_state_info,
            "all_stages": list(DEMO_STAGES.values()),
            "all_sih_states": list(SIH_DEMO_STATES.values()),
            "is_running_auto": self.is_running_auto,
            "event_timeline": list(reversed(self.timeline_events[-30:])),
            "node_id": self.node_id,
            "risk_transition": ["LOW", "MODERATE", "HIGH", "CRITICAL"],
        }

    def generate_sih_state_telemetry(self, state_key: str) -> TelemetryCreate:
        """Generates realistic telemetry packet representing a given SIH demo state."""
        st = SIH_DEMO_STATES.get(state_key, SIH_DEMO_STATES["NORMAL"])
        self.seq_num += 1

        moisture = st["moisture_pct"] + random.gauss(0, 0.5)
        moisture = max(5.0, min(99.0, moisture))

        rain = st["rainfall_pct"] + random.gauss(0, 0.8)
        rain = max(0.0, min(100.0, rain))

        rain_24h = st["rainfall_24h_mm"] + random.gauss(0, 0.6)
        rain_24h = max(0.0, min(250.0, rain_24h))

        tilt = st["tilt_deg"] + random.gauss(0, 0.12)
        tilt = max(5.0, min(85.0, tilt))

        tilt_rate = st["tilt_rate_deg_min"] + random.gauss(0, 0.002)

        rad = math.radians(tilt)
        ax = math.sin(rad) + random.gauss(0, 0.008)
        az = math.cos(rad) + random.gauss(0, 0.008)
        ay = random.gauss(0, 0.008)

        raw_adc = int((1.0 - (moisture / 100.0)) * 3200 + 900)

        return TelemetryCreate(
            node_id=self.node_id,
            timestamp=datetime.utcnow(),
            soil_moisture=round(moisture, 1),
            soil_moisture_raw=raw_adc,
            rainfall=round(rain, 1),
            rainfall_24h=round(rain_24h, 1),
            rain_detected=st["rain_detected"],
            tilt_angle=round(tilt, 2),
            tilt_rate=round(tilt_rate, 3),
            accel_x=round(ax, 3),
            accel_y=round(ay, 3),
            accel_z=round(az, 3),
            gyro_x=round(random.gauss(0, 0.1), 2),
            gyro_y=round(random.gauss(0, 0.1), 2),
            gyro_z=round(random.gauss(0, 0.1), 2),
            battery=88.0,
            battery_mv=3940,
            rssi=-62,
            snr=10.5,
            seq_num=self.seq_num,
        )

    def generate_stage_telemetry(self, stage_id: int) -> TelemetryCreate:
        """Generates a high-fidelity telemetry packet representing the given stage (Phase 11)."""
        stage_map = {1: "NORMAL", 2: "HEAVY_RAIN", 3: "SATURATION", 4: "SLOPE_MOVEMENT"}
        state_key = stage_map.get(stage_id, "NORMAL")
        return self.generate_sih_state_telemetry(state_key)

    async def step_to_sih_state(self, state_key: str, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Executes manual transition to one of the 6 SIH demo states:
        NORMAL, RAIN, HEAVY_RAIN, SATURATION, SLOPE_MOVEMENT, CRITICAL
        """
        if state_key not in SIH_DEMO_STATES:
            state_key = "NORMAL"

        self.current_sih_state = state_key
        st = SIH_DEMO_STATES[state_key]
        now = datetime.utcnow()

        # Map to stage_id for legacy dashboard compatibility
        stage_mapping = {
            "NORMAL": 1,
            "RAIN": 2,
            "HEAVY_RAIN": 2,
            "SATURATION": 3,
            "SLOPE_MOVEMENT": 4,
            "CRITICAL": 4,
        }
        self.current_stage = stage_mapping.get(state_key, 1)

        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        try:
            telemetry_data = self.generate_sih_state_telemetry(state_key)
            telemetry, risk_result, alert = await telemetry_service.process_and_store_telemetry(
                db=db, data=telemetry_data
            )

            # Record milestone event
            self._add_timeline_event(
                event_title=st["milestone"],
                stage_id=self.current_stage,
                timestamp=now,
                risk_level=risk_result.risk_level,
                description=st["description"],
            )

            # Broadcast demo event to WebSocket
            demo_frame = {
                "type": "demo_stage_update",
                "sih_state": state_key,
                "stage": self.current_stage,
                "stage_title": st["title"],
                "risk_level": risk_result.risk_level,
                "risk_score": risk_result.risk_score,
                "factor_of_safety": risk_result.factor_of_safety,
                "disclaimer": DEMO_DISCLAIMER,
                "timeline_events": list(reversed(self.timeline_events[-10:])),
            }
            await ws_manager.broadcast(demo_frame)

            return {
                "status": "success",
                "sih_state": state_key,
                "state_info": st,
                "stage": self.current_stage,
                "telemetry": {
                    "soil_moisture": telemetry.soil_moisture,
                    "rainfall": telemetry.rainfall,
                    "rainfall_24h": telemetry.rainfall_24h,
                    "tilt_angle": telemetry.tilt_angle,
                    "tilt_rate": telemetry.tilt_rate,
                },
                "risk": {
                    "risk_level": risk_result.risk_level,
                    "risk_score": risk_result.risk_score,
                    "factor_of_safety": risk_result.factor_of_safety,
                    "confidence": risk_result.confidence,
                },
                "alert": alert.title if alert else None,
                "disclaimer": DEMO_DISCLAIMER,
                "timeline_events": list(reversed(self.timeline_events[-10:])),
            }
        finally:
            if should_close_db:
                db.close()

    async def step_to_stage(self, stage_id: int, db: Optional[Session] = None) -> Dict[str, Any]:
        """Legacy 4-stage stepping function."""
        stage_map = {1: "NORMAL", 2: "HEAVY_RAIN", 3: "SATURATION", 4: "SLOPE_MOVEMENT"}
        state_key = stage_map.get(stage_id, "NORMAL")
        return await self.step_to_sih_state(state_key=state_key, db=db)

    def _record_stage_milestones(self, stage_id: int, timestamp: datetime, risk_level: str):
        """Appends required event timeline strings."""
        if stage_id == 2:
            self._add_timeline_event("Rainfall detected", stage_id, timestamp, risk_level, "Precipitation sensor triggered; infiltration started.")
            self._add_timeline_event("Moisture threshold crossed", stage_id, timestamp, risk_level, "Volumetric soil moisture exceeded 45% threshold.")
        elif stage_id == 3:
            self._add_timeline_event("Stability indicator decreased", stage_id, timestamp, risk_level, "Geotechnical Factor of Safety degraded below 1.25 due to pore pressure.")
        elif stage_id == 4:
            self._add_timeline_event("Tilt anomaly detected", stage_id, timestamp, risk_level, "Accelerated angular displacement detected by MPU6050 IMU.")
            self._add_timeline_event("HIGH RISK ALERT", stage_id, timestamp, risk_level, "Critical threshold crossed (FoS < 1.0); evacuation siren and automated emergency alert dispatched.")

    def _add_timeline_event(self, event_title: str, stage_id: int, timestamp: datetime, risk_level: str, description: str):
        # Avoid duplicate consecutive same event
        if self.timeline_events and self.timeline_events[-1].get("event") == event_title:
            return
        
        event_obj = {
            "id": f"evt-demo-{len(self.timeline_events) + 1}",
            "timestamp": timestamp.isoformat(),
            "event": event_title,
            "stage": stage_id,
            "status": "completed",
            "risk_level": risk_level,
            "description": description,
            "disclaimer": DEMO_DISCLAIMER,
        }
        self.timeline_events.append(event_obj)
        if len(self.timeline_events) > 100:
            self.timeline_events.pop(0)

    async def run_full_sequence(self, interval_seconds: float = 4.0):
        """Runs the complete 6-state progression sequence automatically."""
        self.is_running_auto = True
        try:
            for s in ["NORMAL", "RAIN", "HEAVY_RAIN", "SATURATION", "SLOPE_MOVEMENT", "CRITICAL"]:
                if not self.is_running_auto:
                    break
                await self.step_to_sih_state(s)
                if s != "CRITICAL":
                    await asyncio.sleep(interval_seconds)
        finally:
            self.is_running_auto = False

    def reset(self):
        """Resets demo back to Stage 1 baseline."""
        self.current_stage = 1
        self.current_sih_state = "NORMAL"
        self.is_running_auto = False
        self._init_timeline()


demo_service = PhysicalDemoService()
