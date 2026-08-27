"""
LANDGUARD AI — SIH Demonstration REST API Endpoints (Phases 11 & 17)
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.services.demo_service import demo_service, DEMO_STAGES, SIH_DEMO_STATES
from app.config import settings

router = APIRouter(prefix="/demo", tags=["SIH Demo Controller"])


@router.get("/status")
def get_demo_status() -> Dict[str, Any]:
    """Returns current state, active stage, and milestone timeline of the SIH demo."""
    return demo_service.get_status()


@router.get("/states")
def get_sih_states() -> List[Dict[str, Any]]:
    """Returns metadata for all 6 controllable SIH demo states."""
    return list(SIH_DEMO_STATES.values())


@router.post("/state/{state_key}")
async def set_sih_state(state_key: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Directly triggers one of the 6 controlled SIH demonstration states:
    - NORMAL: Low moisture, zero rain, stable tilt (LOW risk)
    - RAIN: Ingress of light rain, moisture rising (LOW/MODERATE risk)
    - HEAVY_RAIN: Heavy monsoon downpour, moisture threshold crossed (MODERATE risk)
    - SATURATION: Pore-water saturation, FoS declines (HIGH risk)
    - SLOPE_MOVEMENT: Active shear strain, tilt increases, FoS < 1.0 (CRITICAL alarm)
    - CRITICAL: Severe structural displacement, emergency evacuation siren active
    """
    normalized_key = state_key.upper().strip()
    if normalized_key not in SIH_DEMO_STATES:
        valid_keys = list(SIH_DEMO_STATES.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state '{state_key}'. Must be one of: {valid_keys}",
        )
    
    result = await demo_service.step_to_sih_state(state_key=normalized_key, db=db)
    return result


@router.post("/stage/{stage_id}")
async def set_demo_stage(stage_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Legacy 4-stage stepping endpoint (Phase 11)."""
    if stage_id not in DEMO_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage ID {stage_id}. Choose between 1 and 4.")
    
    result = await demo_service.step_to_stage(stage_id=stage_id, db=db)
    return result


@router.post("/run")
@router.post("/run-sih")
async def run_automated_sequence(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """Starts automated 6-state progression sequence for judging presentations."""
    if demo_service.is_running_auto:
        return {
            "status": "already_running",
            "message": "Demo sequence is already running.",
            "current_state": demo_service.current_sih_state,
        }
    
    background_tasks.add_task(demo_service.run_full_sequence, interval_seconds=float(settings.DEMO_STAGE_INTERVAL_SECONDS))
    return {
        "status": "started",
        "message": f"Automated 6-state SIH demonstration started with {settings.DEMO_STAGE_INTERVAL_SECONDS}s interval.",
        "disclaimer": settings.DEMO_DISCLAIMER,
    }


@router.post("/reset")
def reset_demo() -> Dict[str, Any]:
    """Resets the demonstration back to NORMAL baseline."""
    demo_service.reset()
    return {"status": "reset", "state": "NORMAL", "stage": 1, "message": "Demonstration reset to NORMAL baseline."}
