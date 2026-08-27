from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alert_id: Optional[str] = None
    node_id: str
    risk_assessment_id: Optional[int] = None
    timestamp: datetime
    severity: str = Field(description="info, warning, high, critical")
    title: str
    message: str
    risk_score: float
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    trigger_reason: Optional[str] = None
    trigger_reasons: List[str] = Field(default_factory=list)
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class AlertListResponse(BaseModel):
    count: int
    unacknowledged_count: int
    alerts: List[AlertResponse]


class AlertAcknowledgeResponse(BaseModel):
    id: int
    acknowledged: bool
    acknowledged_at: datetime
    message: str = "Alert acknowledged successfully"
