from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class RiskResult(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    node_id = Column(String(32), ForeignKey("nodes.node_id", ondelete="CASCADE"), nullable=False, index=True)
    telemetry_id = Column(Integer, ForeignKey("telemetry_readings.id", ondelete="SET NULL"), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Quantitative Risk Outputs
    factor_of_safety = Column(Float, nullable=False)  # Limit equilibrium FoS ratio
    risk_score = Column(Float, nullable=False)  # Scaled 0.0 - 1.0 instability probability
    risk_level = Column(String(16), nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    confidence = Column(Float, nullable=False, default=0.85)  # Inference confidence score
    trend = Column(String(16), nullable=False, default="stable")  # rising, falling, stable
    
    # Explainable AI Metadata
    shap_values = Column(Text, nullable=True)  # JSON-encoded array of feature contributions
    features_json = Column(Text, nullable=True)  # JSON-encoded input feature vector
    model_version = Column(String(64), nullable=False, default="v0.1-prototype")

    # Relationships
    node = relationship("Node", back_populates="risk_assessments")
    telemetry = relationship("Telemetry", back_populates="risk_result")
    alert = relationship("Alert", back_populates="risk_result", uselist=False)
