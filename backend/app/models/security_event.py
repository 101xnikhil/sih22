from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database import Base


class SecurityEvent(Base):
    """
    Audit log for IoT edge security events, authentication attempts,
    CRC failures, and replay attack detections (Phase 14).
    """
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    node_id = Column(String(32), nullable=False, index=True)
    sequence_num = Column(Integer, nullable=True)
    action = Column(String(32), nullable=False)  # ACCEPTED, REJECTED_REPLAY, REJECTED_UNAUTHORIZED, REJECTED_CHECKSUM
    reason = Column(Text, nullable=False)
    client_ip = Column(String(64), nullable=True)
