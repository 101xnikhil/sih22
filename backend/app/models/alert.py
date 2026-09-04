from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    node_id = Column(String(32), ForeignKey("nodes.node_id", ondelete="CASCADE"), nullable=False, index=True)
    risk_assessment_id = Column(Integer, ForeignKey("risk_assessments.id", ondelete="SET NULL"), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Alert Severity and Content
    severity = Column(String(16), nullable=False)  # info, warning, high, critical
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    
    # Contextual State
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(16), nullable=False)
    trigger_reason = Column(Text, nullable=True)  # Comma-separated or JSON list of trigger factors
    
    # Acknowledgment Workflow
    acknowledged = Column(Boolean, default=False, nullable=False, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # SMS Dispatch Status (Fast2SMS Quick Route)
    sms_sent = Column(Boolean, default=False, nullable=False)
    sms_sent_at = Column(DateTime, nullable=True)
    sms_error = Column(Text, nullable=True)

    # Relationships
    node = relationship("Node", back_populates="alerts")
    risk_result = relationship("RiskResult", back_populates="alert")
