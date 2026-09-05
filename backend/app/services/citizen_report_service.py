import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.citizen_report import CitizenReport
from app.schemas.citizen_report import CitizenReportCreate, CitizenReportVerifyRequest


def create_report(db: Session, data: CitizenReportCreate) -> CitizenReport:
    report_id = f"CR-2026-{uuid.uuid4().hex[:6].upper()}"
    report = CitizenReport(
        report_id=report_id,
        timestamp=datetime.utcnow(),
        latitude=data.latitude,
        longitude=data.longitude,
        elevation_m=data.elevation_m or 0.0,
        location_name=data.location_name,
        district=data.district,
        state=data.state,
        highway_corridor=data.highway_corridor,
        category=data.category,
        severity=data.severity,
        description=data.description,
        photo_url=data.photo_url,
        reporter_type=data.reporter_type,
        reporter_name=data.reporter_name or "Anonymous Citizen",
        contact_phone=data.contact_phone,
        is_verified=False,
        status="PENDING",
        is_offline_synced=data.is_offline_synced,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def list_reports(
    db: Session, 
    state: Optional[str] = None, 
    severity: Optional[str] = None, 
    corridor: Optional[str] = None,
    verified_only: bool = False,
    limit: int = 100
) -> List[CitizenReport]:
    seed_initial_ner_reports_if_empty(db)
    query = db.query(CitizenReport)
    
    if state and state != "ALL":
        query = query.filter(CitizenReport.state == state)
    if severity and severity != "ALL":
        query = query.filter(CitizenReport.severity == severity)
    if corridor and corridor != "ALL":
        query = query.filter(CitizenReport.highway_corridor == corridor)
    if verified_only:
        query = query.filter(CitizenReport.is_verified == True)
        
    return query.order_by(desc(CitizenReport.timestamp)).limit(limit).all()


def verify_report(db: Session, report_id: str, data: CitizenReportVerifyRequest) -> Optional[CitizenReport]:
    report = db.query(CitizenReport).filter(CitizenReport.report_id == report_id).first()
    if not report:
        return None
        
    report.is_verified = data.is_verified
    report.verified_by = data.verified_by
    report.verified_at = datetime.utcnow()
    report.status = data.status
    db.commit()
    db.refresh(report)
    return report


def seed_initial_ner_reports_if_empty(db: Session) -> None:
    count = db.query(CitizenReport).count()
    if count > 0:
        return

    sample_reports = [
        CitizenReport(
            report_id="CR-2026-NE01A",
            timestamp=datetime.utcnow() - timedelta(hours=2, minutes=14),
            latitude=27.1245,
            longitude=88.5132,
            elevation_m=640.0,
            location_name="29th Mile Teesta Scour Section",
            district="Kalimpong / Gangtok Border",
            state="Sikkim",
            highway_corridor="NH-10",
            category="BLOCKED_ROAD",
            severity="CRITICAL",
            description="Massive mudflow and toe slump inundating both lanes of NH-10. River Teesta undercutting roadway embankment. Heavy vehicular traffic stranded; SDRF requested.",
            photo_url="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
            reporter_type="BRO_PATROL",
            reporter_name="Inspector R. Sangma (BRO Swastik)",
            contact_phone="+91 94350 XXXXX",
            is_verified=True,
            verified_by="Sikkim State Disaster Management Authority",
            verified_at=datetime.utcnow() - timedelta(hours=2),
            status="VERIFIED",
            is_offline_synced=False,
        ),
        CitizenReport(
            report_id="CR-2026-NE02B",
            timestamp=datetime.utcnow() - timedelta(hours=4, minutes=40),
            latitude=25.1789,
            longitude=93.0245,
            elevation_m=510.0,
            location_name="Jatinga Escarpment Track Cut",
            district="Dima Hasao",
            state="Assam",
            highway_corridor="NH-27",
            category="GROUND_CRACKS",
            severity="HIGH",
            description="Fresh 4-inch tension cracks opened longitudinally across upper hill slope adjacent to Lumding-Badarpur railway cutting following continuous torrential cloudburst.",
            photo_url="https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=600&auto=format&fit=crop&q=80",
            reporter_type="FIELD_OFFICER",
            reporter_name="Sub-Divisional Officer PWD (Haflong)",
            contact_phone="+91 98540 XXXXX",
            is_verified=True,
            verified_by="Dima Hasao DDMA Emergency Desk",
            verified_at=datetime.utcnow() - timedelta(hours=4, minutes=10),
            status="VERIFIED",
            is_offline_synced=False,
        ),
        CitizenReport(
            report_id="CR-2026-NE03C",
            timestamp=datetime.utcnow() - timedelta(hours=7, minutes=5),
            latitude=27.5861,
            longitude=91.8654,
            elevation_m=2750.0,
            location_name="Sela Pass West Approach Cut",
            district="Tawang",
            state="Arunachal Pradesh",
            highway_corridor="NH-13",
            category="ROCKFALL",
            severity="MODERATE",
            description="Intermittent granite boulder roll and scree sliding down 60-degree steep cutting. Single-lane convoy pilot vehicle escort currently operational.",
            photo_url="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80",
            reporter_type="CITIZEN",
            reporter_name="Tenzing Norbu (Local Taxi Union)",
            contact_phone="+91 94360 XXXXX",
            is_verified=True,
            verified_by="Arunachal SDRF Control Cell",
            verified_at=datetime.utcnow() - timedelta(hours=6, minutes=30),
            status="VERIFIED",
            is_offline_synced=True,
        ),
        CitizenReport(
            report_id="CR-2026-NE04D",
            timestamp=datetime.utcnow() - timedelta(hours=9, minutes=20),
            latitude=25.2986,
            longitude=91.5822,
            elevation_m=1280.0,
            location_name="Mawkdok Dympep Valley Vista",
            district="East Khasi Hills",
            state="Meghalaya",
            highway_corridor="Shillong-Sohra Road",
            category="SLOPE_SLUMP",
            severity="MODERATE",
            description="Upper organic topsoil layer saturated and sliding down sandstone benching. Water seeping profusely through retaining gabion wall weep holes.",
            photo_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
            reporter_type="CITIZEN",
            reporter_name="L. Khongwir (Village Headman)",
            contact_phone="+91 98620 XXXXX",
            is_verified=True,
            verified_by="East Khasi Hills DDMA",
            verified_at=datetime.utcnow() - timedelta(hours=8, minutes=50),
            status="VERIFIED",
            is_offline_synced=False,
        ),
        CitizenReport(
            report_id="CR-2026-NE05E",
            timestamp=datetime.utcnow() - timedelta(minutes=45),
            latitude=24.8123,
            longitude=93.6421,
            elevation_m=420.0,
            location_name="Tupul Railway Bridge Pier 4",
            district="Noney",
            state="Manipur",
            highway_corridor="NH-102B",
            category="RIVER_DAMMING",
            severity="CRITICAL",
            description="Debris slump partially choking river stream bed below Tupul railway corridor. Water backing up creating temporary impoundment. Immediate earthmovers required.",
            photo_url="https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80",
            reporter_type="BRO_PATROL",
            reporter_name="K. Sharma (Railway Engineering Corps)",
            contact_phone="+91 94390 XXXXX",
            is_verified=False,
            status="PENDING",
            is_offline_synced=False,
        ),
    ]

    for rep in sample_reports:
        db.add(rep)
    db.commit()
