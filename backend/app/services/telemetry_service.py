import json
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.node import Node
from app.models.telemetry import Telemetry
from app.models.risk import RiskResult
from app.models.alert import Alert
from app.schemas.telemetry import TelemetryCreate
from app.services.risk_engine import risk_engine
from app.services.alert_service import alert_service
from app.services.websocket_manager import ws_manager


class TelemetryService:
    @staticmethod
    async def process_and_store_telemetry(
        db: Session,
        data: TelemetryCreate,
    ) -> Tuple[Telemetry, RiskResult, Optional[Alert]]:
        """
        Complete processing pipeline for incoming sensor telemetry packets:
        1. Validate/create Node entry & update last_seen timestamp
        2. Store Telemetry record
        3. Compute Gray-Box Physics Risk & SHAP Attributions
        4. Store RiskResult record
        5. Check alert thresholds & generate Alert if triggered
        6. Broadcast real-time event frame to connected WebSocket clients
        """
        # 1. Ensure node exists
        node = db.query(Node).filter(Node.node_id == data.node_id).first()
        if not node:
            node = Node(
                node_id=data.node_id,
                name=f"Monitoring Node {data.node_id}",
                status="online",
                last_seen=datetime.utcnow(),
            )
            db.add(node)
            db.commit()
            db.refresh(node)
        else:
            node.last_seen = datetime.utcnow()
            node.status = "online"
            db.commit()

        # 2. Store Telemetry
        telemetry = Telemetry(
            node_id=data.node_id,
            timestamp=data.timestamp or datetime.utcnow(),
            soil_moisture=data.soil_moisture,
            soil_moisture_raw=data.soil_moisture_raw,
            rainfall=data.rainfall,
            rainfall_24h=data.rainfall_24h,
            rain_detected=data.rain_detected,
            tilt_angle=data.tilt_angle,
            tilt_rate=data.tilt_rate,
            accel_x=data.accel_x,
            accel_y=data.accel_y,
            accel_z=data.accel_z,
            gyro_x=data.gyro_x,
            gyro_y=data.gyro_y,
            gyro_z=data.gyro_z,
            battery=data.battery,
            battery_mv=data.battery_mv,
            rssi=data.rssi,
            snr=data.snr,
            seq_num=data.seq_num,
        )
        db.add(telemetry)
        db.commit()
        db.refresh(telemetry)

        # 3. Retrieve recent risk scores for slope velocity trend calculation
        recent_assessments = (
            db.query(RiskResult.risk_score)
            .filter(RiskResult.node_id == data.node_id)
            .order_by(desc(RiskResult.timestamp))
            .limit(10)
            .all()
        )
        recent_scores = [r[0] for r in reversed(recent_assessments)]

        # 4. Run Risk Engine
        risk_output = risk_engine.compute_risk(
            soil_moisture_pct=data.soil_moisture,
            rainfall_pct=data.rainfall,
            rainfall_24h_mm=data.rainfall_24h,
            tilt_angle_deg=data.tilt_angle,
            tilt_rate_deg_min=data.tilt_rate,
            recent_scores=recent_scores,
        )

        risk_result = RiskResult(
            node_id=data.node_id,
            telemetry_id=telemetry.id,
            timestamp=telemetry.timestamp,
            factor_of_safety=risk_output["factor_of_safety"],
            risk_score=risk_output["risk_score"],
            risk_level=risk_output["risk_level"],
            confidence=risk_output["confidence"],
            trend=risk_output["trend"],
            shap_values=json.dumps(risk_output["shap_values"]),
            features_json=json.dumps(risk_output["features"]),
            model_version=risk_output["model_version"],
        )
        db.add(risk_result)
        db.commit()
        db.refresh(risk_result)

        # 5. Evaluate and generate alerts
        new_alert = alert_service.process_risk_and_create_alert(
            db=db,
            node_id=data.node_id,
            risk_result=risk_result,
        )

        # 6. Broadcast to WebSocket clients
        broadcast_payload = {
            "type": "telemetry_update",
            "node_id": data.node_id,
            "timestamp": telemetry.timestamp.isoformat(),
            "telemetry": {
                "id": telemetry.id,
                "soil_moisture": telemetry.soil_moisture,
                "rainfall": telemetry.rainfall,
                "rainfall_24h": telemetry.rainfall_24h,
                "tilt_angle": telemetry.tilt_angle,
                "tilt_rate": telemetry.tilt_rate,
                "battery": telemetry.battery,
                "battery_mv": telemetry.battery_mv,
                "rssi": telemetry.rssi,
                "snr": telemetry.snr,
                "seq_num": telemetry.seq_num,
            },
            "risk": {
                "id": risk_result.id,
                "factor_of_safety": risk_result.factor_of_safety,
                "risk_score": risk_result.risk_score,
                "risk_level": risk_result.risk_level,
                "confidence": risk_result.confidence,
                "trend": risk_result.trend,
                "shap_values": risk_output["shap_values"],
            },
            "alert": {
                "id": new_alert.id,
                "severity": new_alert.severity,
                "title": new_alert.title,
                "message": new_alert.message,
            } if new_alert else None,
        }
        await ws_manager.broadcast(broadcast_payload)

        return telemetry, risk_result, new_alert

    @staticmethod
    def get_latest_telemetry(db: Session, node_id: str) -> Optional[Telemetry]:
        return (
            db.query(Telemetry)
            .filter(Telemetry.node_id == node_id)
            .order_by(desc(Telemetry.timestamp))
            .first()
        )

    @staticmethod
    def get_telemetry_history(db: Session, node_id: str, limit: int = 100) -> List[Telemetry]:
        return (
            db.query(Telemetry)
            .filter(Telemetry.node_id == node_id)
            .order_by(desc(Telemetry.timestamp))
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_latest_risk(db: Session, node_id: str) -> Optional[RiskResult]:
        return (
            db.query(RiskResult)
            .filter(RiskResult.node_id == node_id)
            .order_by(desc(RiskResult.timestamp))
            .first()
        )

    @staticmethod
    def get_risk_history(db: Session, node_id: str, limit: int = 100) -> List[RiskResult]:
        return (
            db.query(RiskResult)
            .filter(RiskResult.node_id == node_id)
            .order_by(desc(RiskResult.timestamp))
            .limit(limit)
            .all()
        )


telemetry_service = TelemetryService()
