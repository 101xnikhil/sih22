from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


class CitizenReportCreate(BaseModel):
    latitude: float = Field(..., description="GPS latitude")
    longitude: float = Field(..., description="GPS longitude")
    elevation_m: Optional[float] = Field(default=0.0)
    location_name: str = Field(..., min_length=2, max_length=256)
    district: str = Field(..., min_length=2, max_length=128)
    state: str = Field(default="Assam", max_length=64)
    highway_corridor: Optional[str] = Field(default=None, max_length=128)
    category: str = Field(..., description="GROUND_CRACKS, SLOPE_SLUMP, ROCKFALL, BLOCKED_ROAD, RIVER_DAMMING")
    severity: str = Field(default="MODERATE", description="LOW, MODERATE, HIGH, CRITICAL")
    description: str = Field(..., min_length=5, max_length=2000)
    photo_url: Optional[str] = None
    reporter_type: str = Field(default="CITIZEN", description="CITIZEN, FIELD_OFFICER, BRO_PATROL, SDRF")
    reporter_name: Optional[str] = Field(default="Anonymous Resident", max_length=128)
    contact_phone: Optional[str] = Field(default=None, max_length=32)
    is_offline_synced: bool = Field(default=False)


class CitizenReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: str
    timestamp: datetime
    latitude: float
    longitude: float
    elevation_m: Optional[float] = 0.0
    location_name: str
    district: str
    state: str
    highway_corridor: Optional[str] = None
    category: str
    severity: str
    description: str
    photo_url: Optional[str] = None
    reporter_type: str
    reporter_name: Optional[str] = None
    contact_phone: Optional[str] = None
    is_verified: bool
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    status: str
    is_offline_synced: bool


class CitizenReportVerifyRequest(BaseModel):
    is_verified: bool
    verified_by: str = "District Disaster Management Authority (DDMA)"
    status: str = "VERIFIED"  # VERIFIED, RESOLVED, DISMISSED


class CitizenReportListResponse(BaseModel):
    count: int
    pending_count: int
    verified_count: int
    reports: List[CitizenReportResponse]
