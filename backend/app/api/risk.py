from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db
from app.schemas.risk import RiskResponse, RiskHistoryResponse
from app.services.telemetry_service import telemetry_service
from app.models.risk import RiskResult

router = APIRouter(prefix="/risk", tags=["Risk"])


def _format_risk_response(risk: RiskResult) -> RiskResponse:
    shap_data = json.loads(risk.shap_values) if risk.shap_values else None
    feat_data = json.loads(risk.features_json) if risk.features_json else None
    
    return RiskResponse(
        id=risk.id,
        node_id=risk.node_id,
        telemetry_id=risk.telemetry_id,
        timestamp=risk.timestamp,
        factor_of_safety=risk.factor_of_safety,
        risk_score=risk.risk_score,
        risk_level=risk.risk_level,
        confidence=risk.confidence,
        trend=risk.trend,
        shap_values=shap_data,
        features=feat_data,
        model_version=risk.model_version,
    )


@router.get("/{node_id}", response_model=RiskResponse)
def get_latest_risk(node_id: str, db: Session = Depends(get_db)):
    """Retrieve the most recent AI hazard risk assessment for a given node."""
    risk = telemetry_service.get_latest_risk(db=db, node_id=node_id)
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No risk assessments found for node '{node_id}'",
        )
    return _format_risk_response(risk)


@router.get("/{node_id}/history", response_model=RiskHistoryResponse)
def get_risk_history(
    node_id: str,
    limit: int = Query(default=100, ge=1, le=500, description="Max risk assessments to return"),
    db: Session = Depends(get_db),
):
    """Retrieve historical hazard risk trajectory for a given node."""
    assessments = telemetry_service.get_risk_history(db=db, node_id=node_id, limit=limit)
    formatted = [_format_risk_response(r) for r in assessments]
    return RiskHistoryResponse(
        node_id=node_id,
        count=len(formatted),
        assessments=formatted,
    )
