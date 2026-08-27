from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.security import (
    SecurityEventResponse,
    SecurityEventListResponse,
    SecurityStatusResponse,
)
from app.services.security_service import security_service

router = APIRouter(prefix="/security", tags=["Security"])


@router.get("/events", response_model=SecurityEventListResponse)
def get_security_events(
    action: Optional[str] = Query(default=None, description="Filter by action: ACCEPTED, REJECTED_REPLAY, REJECTED_UNAUTHORIZED, REJECTED_CHECKSUM"),
    node_id: Optional[str] = Query(default=None, description="Filter by node ID"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve cybersecurity audit log events (Replay detections, auth checks)."""
    events = security_service.get_security_events(
        db=db,
        limit=limit,
        offset=offset,
        action=action,
        node_id=node_id,
    )
    return SecurityEventListResponse(
        count=len(events),
        events=events,
    )


@router.get("/status", response_model=SecurityStatusResponse)
def get_security_status(db: Session = Depends(get_db)):
    """Retrieve security subsystem health and active watermarks."""
    status = security_service.get_security_status(db=db)
    return SecurityStatusResponse(**status)


@router.post("/reset-watermarks")
def reset_watermarks():
    """Reset in-memory sequence watermarks for fresh demo runs."""
    security_service.reset_watermarks()
    return {"status": "ok", "message": "Sequence watermarks cleared successfully"}
