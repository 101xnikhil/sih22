from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from datetime import datetime
from app.database import Base


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Location & Georeference
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=True, default=0.0)
    location_name = Column(String(256), nullable=False)
    district = Column(String(128), nullable=False)
    state = Column(String(64), nullable=False)
    highway_corridor = Column(String(128), nullable=True)  # e.g., NH-10, NH-27

    # Hazard Classification
    category = Column(String(64), nullable=False)  # GROUND_CRACKS, SLOPE_SLUMP, ROCKFALL, BLOCKED_ROAD, RIVER_DAMMING
    severity = Column(String(32), nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    photo_url = Column(Text, nullable=True)  # Base64 data URI or asset URL

    # Reporter Metadata
    reporter_type = Column(String(32), default="CITIZEN", nullable=False)  # CITIZEN, FIELD_OFFICER, BRO_PATROL, SDRF
    reporter_name = Column(String(128), nullable=True)
    contact_phone = Column(String(32), nullable=True)

    # Verification Workflow
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    verified_by = Column(String(128), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="PENDING", nullable=False)  # PENDING, VERIFIED, RESOLVED, DISMISSED
    is_offline_synced = Column(Boolean, default=False, nullable=False)
