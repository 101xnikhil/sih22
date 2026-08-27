from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any


class ShapFeature(BaseModel):
    feature: str
    display_name: str
    value: float
    contribution: float


class RiskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    node_id: str
    telemetry_id: Optional[int] = None
    timestamp: datetime
    factor_of_safety: float = Field(description="Limit equilibrium FoS ratio")
    risk_score: float = Field(ge=0.0, le=1.0, description="Risk probability score (0.0 - 1.0)")
    risk_level: str = Field(description="LOW, MODERATE, HIGH, CRITICAL")
    confidence: float = Field(default=0.85, description="Model inference confidence score")
    trend: str = Field(default="stable", description="rising, falling, stable")
    shap_values: Optional[List[ShapFeature]] = None
    features: Optional[Dict[str, float]] = None
    model_version: str = "v0.1-prototype"


class RiskHistoryResponse(BaseModel):
    node_id: str
    count: int
    assessments: List[RiskResponse]
