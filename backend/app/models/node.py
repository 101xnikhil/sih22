from sqlalchemy import Column, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Node(Base):
    __tablename__ = "nodes"

    node_id = Column(String(32), primary_key=True, index=True)
    name = Column(String(128), nullable=False, default="Slope Monitor Station")
    latitude = Column(Float, nullable=False, default=31.1048)
    longitude = Column(Float, nullable=False, default=77.1734)
    altitude_m = Column(Float, nullable=False, default=2276.0)
    description = Column(Text, nullable=True, default="Sector 7 — Northern Ridge Face")
    status = Column(String(32), nullable=False, default="online")  # online, degraded, offline
    firmware_version = Column(String(64), nullable=False, default="v0.1.3-proto")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    # Relationships
    telemetries = relationship("Telemetry", back_populates="node", cascade="all, delete-orphan", order_by="desc(Telemetry.timestamp)")
    risk_assessments = relationship("RiskResult", back_populates="node", cascade="all, delete-orphan", order_by="desc(RiskResult.timestamp)")
    alerts = relationship("Alert", back_populates="node", cascade="all, delete-orphan", order_by="desc(Alert.timestamp)")
