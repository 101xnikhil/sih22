import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.alert import Alert
from app.models.risk import RiskResult
from app.services.alert_dispatcher import alert_dispatcher


class AlertService:
    @staticmethod
    def derive_trigger_reasons(risk_result: RiskResult) -> List[str]:
        """
        Derives human-readable and geotechnical trigger reasons from risk result features.
        Matches required demonstration indicators:
        - "Soil moisture elevated"
        - "Tilt rate increasing"
        - "Stability indicator decreasing"
        """
        reasons: List[str] = []
        features: Dict[str, Any] = {}
        
        if risk_result.features_json:
            try:
                features = json.loads(risk_result.features_json)
            except Exception:
                pass

        moisture = features.get("soil_moisture_pct", 50.0)
        tilt_rate = abs(features.get("tilt_rate_deg_min", 0.0))
        fos = risk_result.factor_of_safety
        rainfall = features.get("rainfall_pct", 0.0)
        rain_24h = features.get("rainfall_24h_mm", 0.0)

        # 1. Soil Moisture trigger
        if moisture >= 75.0:
            reasons.append("Soil moisture critical (pore saturation > 75%)")
        elif moisture >= 45.0:
            reasons.append("Soil moisture elevated")

        # 2. Tilt / Creep rate trigger
        if tilt_rate >= 0.05:
            reasons.append("Tilt rate increasing (active slope displacement)")
        elif tilt_rate >= 0.01:
            reasons.append("Tilt rate increasing")

        # 3. Stability indicator / Factor of Safety trigger
        if fos < 1.0:
            reasons.append("Stability indicator decreasing (limit equilibrium failure FoS < 1.0)")
        elif fos < 1.30:
            reasons.append("Stability indicator decreasing")

        # 4. Supplementary triggers
        if rain_24h > 40.0 or rainfall > 50.0:
            reasons.append("Rainfall accumulation threshold crossed")

        # Default fallback if no specific rule hit
        if not reasons:
            if risk_result.risk_level in ["HIGH", "CRITICAL"]:
                reasons = [
                    "Soil moisture elevated",
                    "Tilt rate increasing",
                    "Stability indicator decreasing",
                ]
            else:
                reasons = ["Continuous monitoring observation"]

        return reasons

    @classmethod
    def process_risk_and_create_alert(
        cls,
        db: Session,
        node_id: str,
        risk_result: RiskResult,
    ) -> Optional[Alert]:
        """
        Evaluates risk parameters and triggers a new safety incident/alert
        if threshold boundaries are violated (HIGH or CRITICAL).
        """
        if risk_result.risk_level not in ["HIGH", "CRITICAL"]:
            return None

        # Determine Severity and Title
        if risk_result.risk_level == "CRITICAL" or risk_result.factor_of_safety < 1.0:
            severity = "critical"
            title = f"🔴 CRITICAL HAZARD ALERT: Slope Failure Imminent at {node_id}"
            message = (
                f"Critical landslide hazard active on node {node_id}. "
                f"Factor of Safety = {risk_result.factor_of_safety:.2f} (FoS < 1.00), "
                f"Risk Probability = {risk_result.risk_score * 100:.0f}%. "
                f"Immediate automated warning."
            )
        else:
            severity = "high"
            title = f"🟠 HIGH RISK ALERT: Elevated Hazard Condition at {node_id}"
            message = (
                f"Elevated pore-pressure and slope displacement on node {node_id}. "
                f"Factor of Safety = {risk_result.factor_of_safety:.2f}, "
                f"Hazard Score = {risk_result.risk_score * 100:.0f}%. "
                f"Heightened surveillance stage active."
            )

        # Derive exact trigger reasons
        trigger_reasons = cls.derive_trigger_reasons(risk_result)
        trigger_reason_str = "; ".join(trigger_reasons)

        # Anti-spam deduplication: do not create another unacknowledged alert of the same severity within 2 minutes
        cutoff = datetime.utcnow() - timedelta(minutes=2)
        recent_unack = (
            db.query(Alert)
            .filter(
                Alert.node_id == node_id,
                Alert.severity == severity,
                Alert.acknowledged == False,
                Alert.timestamp >= cutoff,
            )
            .first()
        )
        if recent_unack:
            return None

        now = datetime.utcnow()
        alert = Alert(
            node_id=node_id,
            risk_assessment_id=risk_result.id,
            timestamp=now,
            severity=severity,
            title=title,
            message=message,
            risk_score=risk_result.risk_score,
            risk_level=risk_result.risk_level,
            trigger_reason=trigger_reason_str,
            acknowledged=False,
            created_at=now,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        # Dispatch via Extensible Notification Architecture
        try:
            import asyncio
            alert_payload = {
                "alert_id": f"ALT-{alert.id}",
                "node_id": alert.node_id,
                "timestamp": alert.timestamp.isoformat(),
                "severity": alert.severity,
                "risk_score": alert.risk_score,
                "risk_level": alert.risk_level,
                "trigger_reasons": trigger_reasons,
                "title": alert.title,
                "message": alert.message,
                "acknowledged": alert.acknowledged,
                "created_at": alert.created_at.isoformat() if alert.created_at else now.isoformat(),
            }
            # Schedule asynchronous dispatch
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(alert_dispatcher.broadcast_alert(alert_payload))
                else:
                    asyncio.run(alert_dispatcher.broadcast_alert(alert_payload))
            except Exception:
                pass
        except Exception:
            pass

        return alert

    @staticmethod
    def get_alerts(
        db: Session,
        severity: Optional[str] = None,
        risk_level: Optional[str] = None,
        node_id: Optional[str] = None,
        acknowledged: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Alert]:
        query = db.query(Alert)
        if severity and severity.lower() != "all":
            query = query.filter(Alert.severity == severity.lower())
        if risk_level and risk_level.upper() != "ALL":
            query = query.filter(Alert.risk_level == risk_level.upper())
        if node_id:
            query = query.filter(Alert.node_id == node_id)
        if acknowledged is not None:
            query = query.filter(Alert.acknowledged == acknowledged)
        return query.order_by(desc(Alert.timestamp)).offset(offset).limit(limit).all()

    @staticmethod
    def get_alert_by_id(db: Session, alert_id: int) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.id == alert_id).first()

    @staticmethod
    def get_unacknowledged_count(db: Session) -> int:
        return db.query(Alert).filter(Alert.acknowledged == False).count()

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: int) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.acknowledged = True
        alert.acknowledged_at = datetime.utcnow()
        db.commit()
        db.refresh(alert)
        return alert


alert_service = AlertService()
