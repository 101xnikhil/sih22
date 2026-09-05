import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.citizen_report import (
    CitizenReportCreate,
    CitizenReportResponse,
    CitizenReportListResponse,
    CitizenReportVerifyRequest,
)
from app.services import citizen_report_service

logger = logging.getLogger("landguard.reports")
router = APIRouter(prefix="/reports", tags=["Citizen & Field Reporting"])


@router.post("", response_model=CitizenReportResponse, status_code=status.HTTP_201_CREATED)
def submit_citizen_report(
    payload: CitizenReportCreate,
    db: Session = Depends(get_db)
):
    """
    Ingest a geo-tagged citizen or field officer ground-truth observation.
    Supports cracks, slope movement, rockfall, blocked roads, and river impoundment.
    Accepts offline-queued reports sent when network connectivity is re-established.
    """
    try:
        report = citizen_report_service.create_report(db, payload)
        logger.info(f"Report ingested: {report.report_id} at {report.location_name} ({report.severity})")
        return report
    except Exception as e:
        logger.error(f"Failed to submit citizen report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save incident report: {str(e)}"
        )


@router.get("", response_model=CitizenReportListResponse)
def list_citizen_reports(
    state: Optional[str] = Query(None, description="Filter by state (e.g. Assam, Sikkim, Meghalaya)"),
    severity: Optional[str] = Query(None, description="Filter by severity (LOW, MODERATE, HIGH, CRITICAL)"),
    corridor: Optional[str] = Query(None, description="Filter by highway corridor (e.g. NH-10, NH-27)"),
    verified_only: bool = Query(False, description="Show only DDMA-verified reports"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Retrieve live crowdsourced citizen and field reports across the North Eastern Region.
    """
    reports = citizen_report_service.list_reports(
        db, state=state, severity=severity, corridor=corridor, verified_only=verified_only, limit=limit
    )
    pending_count = sum(1 for r in reports if not r.is_verified)
    verified_count = sum(1 for r in reports if r.is_verified)
    
    return CitizenReportListResponse(
        count=len(reports),
        pending_count=pending_count,
        verified_count=verified_count,
        reports=reports
    )


@router.patch("/{report_id}/verify", response_model=CitizenReportResponse)
def verify_citizen_report(
    report_id: str,
    payload: CitizenReportVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify or update status of a citizen incident report (District Administration Action).
    """
    updated = citizen_report_service.verify_report(db, report_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found"
        )
    return updated
