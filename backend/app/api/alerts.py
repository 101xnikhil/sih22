from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.schemas.alert import AlertResponse, AlertListResponse, AlertAcknowledgeResponse
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def format_alert_response(alert) -> AlertResponse:
    reasons = [r.strip() for r in alert.trigger_reason.split(";")] if alert.trigger_reason else []
    return AlertResponse(
        id=alert.id,
        alert_id=f"ALT-{alert.id}",
        node_id=alert.node_id,
        risk_assessment_id=alert.risk_assessment_id,
        timestamp=alert.timestamp,
        severity=alert.severity,
        title=alert.title,
        message=alert.message,
        risk_score=alert.risk_score,
        risk_level=alert.risk_level,
        trigger_reason=alert.trigger_reason or "; ".join(reasons),
        trigger_reasons=reasons,
        acknowledged=alert.acknowledged,
        acknowledged_at=alert.acknowledged_at,
        created_at=getattr(alert, "created_at", None) or alert.timestamp,
    )


@router.get("", response_model=AlertListResponse)
def list_alerts(
    severity: Optional[str] = Query(default=None, description="Filter by severity: critical, high, warning, info"),
    risk_level: Optional[str] = Query(default=None, description="Filter by risk level: LOW, MODERATE, HIGH, CRITICAL"),
    node_id: Optional[str] = Query(default=None, description="Filter by node ID"),
    acknowledged: Optional[bool] = Query(default=None, description="Filter by acknowledgment status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve safety incidents and alarm logs (Alert History)."""
    alerts = alert_service.get_alerts(
        db=db,
        severity=severity,
        risk_level=risk_level,
        node_id=node_id,
        acknowledged=acknowledged,
        limit=limit,
        offset=offset,
    )
    unack_count = alert_service.get_unacknowledged_count(db=db)
    
    formatted_alerts = [format_alert_response(a) for a in alerts]
    
    return AlertListResponse(
        count=len(formatted_alerts),
        unacknowledged_count=unack_count,
        alerts=formatted_alerts,
    )


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_detail(alert_id: int, db: Session = Depends(get_db)):
    """Retrieve full details for a single alert."""
    alert = alert_service.get_alert_by_id(db=db, alert_id=alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found",
        )
    return format_alert_response(alert)


@router.post("/{alert_id}/acknowledge", response_model=AlertAcknowledgeResponse)
@router.post("/{alert_id}/ack", response_model=AlertAcknowledgeResponse)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    """Acknowledge a safety alarm / incident."""
    alert = alert_service.acknowledge_alert(db=db, alert_id=alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} not found",
        )
    return AlertAcknowledgeResponse(
        id=alert.id,
        acknowledged=alert.acknowledged,
        acknowledged_at=alert.acknowledged_at,
        message="Incident acknowledged and logged",
    )
