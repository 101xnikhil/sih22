from datetime import datetime
from typing import Optional, Tuple, List, Dict
import logging
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.config import settings
from app.database import engine
from app.models.security_event import SecurityEvent

logger = logging.getLogger("landguard.security")

# Ensure table exists in database
try:
    SecurityEvent.__table__.create(bind=engine, checkfirst=True)
except Exception:
    pass


class SecurityService:
    """
    Edge IoT Cybersecurity & Telemetry Guard Service (Phase 14).
    Enforces device authorization, sequence tracking, and replay attack prevention.
    """

    def __init__(self):
        # In-memory sequence watermark per node_id for low-latency replay filtering
        self._last_sequence_by_node: Dict[str, int] = {}

    def is_node_authorized(self, node_id: str) -> bool:
        """Verifies if the transmitting node is in the authorized device registry."""
        return node_id in settings.AUTHORIZED_NODES

    def validate_api_key(self, api_key: Optional[str]) -> bool:
        """Validates gateway API key if required."""
        if not settings.REQUIRE_API_KEY:
            return True
        return api_key == settings.GATEWAY_API_KEY

    def check_telemetry_security(
        self,
        db: Session,
        node_id: str,
        seq_num: Optional[int],
        client_ip: Optional[str] = None,
    ) -> Tuple[bool, str, str]:
        """
        Validates incoming telemetry against security rules:
        1. Node Authorization
        2. Monotonic Sequence Number / Replay Attack Detection

        Returns: (is_allowed: bool, action: str, reason: str)
        """
        now = datetime.utcnow()

        # 1. Check Node Authorization
        if not self.is_node_authorized(node_id):
            action = "REJECTED_UNAUTHORIZED"
            reason = f"Unauthorized device ID '{node_id}' not found in authorized node registry."
            self.log_security_event(
                db=db,
                node_id=node_id,
                sequence_num=seq_num,
                action=action,
                reason=reason,
                client_ip=client_ip,
            )
            logger.warning(f"[SECURITY] {action} | Node {node_id} | Reason: {reason}")
            return False, action, reason

        # 2. Check Sequence Number & Replay Detection
        if seq_num is not None:
            last_seq = self._last_sequence_by_node.get(node_id)

            if last_seq is not None and seq_num <= last_seq:
                action = "REJECTED_REPLAY"
                reason = f"REPLAY DETECTED — Sequence #{seq_num} is <= last seen sequence #{last_seq} for node {node_id}."
                self.log_security_event(
                    db=db,
                    node_id=node_id,
                    sequence_num=seq_num,
                    action=action,
                    reason=reason,
                    client_ip=client_ip,
                )
                logger.warning(f"[SECURITY] {action} | Node {node_id} | Seq #{seq_num} | Last #{last_seq}")
                return False, action, reason

            # Valid new sequence number -> update watermark
            self._last_sequence_by_node[node_id] = seq_num

        action = "ACCEPTED"
        reason = f"Valid authorized telemetry frame accepted (Sequence #{seq_num if seq_num is not None else 'N/A'})."
        self.log_security_event(
            db=db,
            node_id=node_id,
            sequence_num=seq_num,
            action=action,
            reason=reason,
            client_ip=client_ip,
        )
        return True, action, reason

    def log_security_event(
        self,
        db: Session,
        node_id: str,
        sequence_num: Optional[int],
        action: str,
        reason: str,
        client_ip: Optional[str] = None,
    ) -> SecurityEvent:
        """Records an audit log entry for security monitoring."""
        event = SecurityEvent(
            timestamp=datetime.utcnow(),
            node_id=node_id,
            sequence_num=sequence_num,
            action=action,
            reason=reason,
            client_ip=client_ip,
        )
        try:
            db.add(event)
            db.commit()
            db.refresh(event)
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to commit security event log: {e}")
        return event

    def get_security_events(
        self,
        db: Session,
        limit: int = 50,
        offset: int = 0,
        action: Optional[str] = None,
        node_id: Optional[str] = None,
    ) -> List[SecurityEvent]:
        """Retrieves historical security audit logs."""
        query = db.query(SecurityEvent)
        if action and action.upper() != "ALL":
            query = query.filter(SecurityEvent.action == action.upper())
        if node_id:
            query = query.filter(SecurityEvent.node_id == node_id)
        return query.order_by(desc(SecurityEvent.timestamp)).offset(offset).limit(limit).all()

    def get_security_status(self, db: Session) -> Dict:
        """Returns the current security subsystem operational posture."""
        total_events = db.query(SecurityEvent).count()
        return {
            "is_active": True,
            "replay_protection_enabled": True,
            "authorized_nodes": settings.AUTHORIZED_NODES,
            "last_sequence_by_node": self._last_sequence_by_node,
            "total_events_logged": total_events,
        }

    def reset_watermarks(self):
        """Resets sequence watermarks (used for testing or clean laboratory demo runs)."""
        self._last_sequence_by_node.clear()


security_service = SecurityService()
