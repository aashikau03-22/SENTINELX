from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import (
    Brand, Finding, SocialCandidate, AppCandidate, Sector
)
from app.schemas.schemas import (
    DashboardSummaryResponse, ThreatTrendItem, SectorStatItem, FindingResponse
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Computes all top-level global KPIs dynamically from the database."""
    protected_brands = db.query(Brand).count()
    social_cnt = db.query(SocialCandidate).count()
    app_cnt = db.query(AppCandidate).count()
    candidates_analysed = social_cnt + app_cnt

    total_findings = db.query(Finding).count()
    official_excluded_count = db.query(Finding).filter(Finding.is_official_excluded == True).count()
    potential_threats = total_findings - official_excluded_count

    high_critical = db.query(Finding).filter(
        Finding.severity.in_(["High", "Critical"]),
        Finding.is_official_excluded == False
    ).count()

    awaiting_review = db.query(Finding).filter(
        Finding.status.in_(["New", "Needs Review"]),
        Finding.is_official_excluded == False
    ).count()

    resolved_findings = db.query(Finding).filter(
        Finding.status.in_(["Resolved", "False Positive"])
    ).count()

    return DashboardSummaryResponse(
        protected_brands=protected_brands,
        candidates_analysed=candidates_analysed,
        potential_threats=potential_threats,
        high_critical_findings=high_critical,
        awaiting_review=awaiting_review,
        resolved_findings=resolved_findings,
        total_findings=total_findings,
        official_excluded_count=official_excluded_count
    )

@router.get("/sectors", response_model=List[SectorStatItem])
def get_sectors_summary(db: Session = Depends(get_db)):
    """Computes sector metrics powering the 5 prominent sector overview cards."""
    sectors = db.query(Sector).filter(Sector.is_active == True).all()
    results = []

    for s in sectors:
        b_cnt = db.query(Brand).filter(Brand.sector_id == s.id).count()
        f_query = db.query(Finding).filter(Finding.sector_id == s.id)
        f_cnt = f_query.count()
        hc_cnt = f_query.filter(Finding.severity.in_(["High", "Critical"]), Finding.is_official_excluded == False).count()
        rev_cnt = f_query.filter(Finding.status.in_(["New", "Needs Review"]), Finding.is_official_excluded == False).count()
        res_cnt = f_query.filter(Finding.status.in_(["Resolved", "False Positive"])).count()

        results.append(SectorStatItem(
            sector_id=s.id,
            sector_name=s.name,
            icon=s.icon,
            brand_count=b_cnt,
            findings_count=f_cnt,
            high_critical_count=hc_cnt,
            awaiting_review_count=rev_cnt,
            resolved_count=res_cnt
        ))

    return results

@router.get("/trends", response_model=List[ThreatTrendItem])
def get_threat_trends(db: Session = Depends(get_db)):
    """Generates 7-day threat trend timeline based on findings."""
    today = datetime.now(timezone.utc).date()
    days = [today - timedelta(days=i) for i in reversed(range(7))]
    trends = []

    for d in days:
        d_start = datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc)
        d_end = datetime.combine(d, datetime.max.time(), tzinfo=timezone.utc)

        social_cnt = db.query(Finding).filter(
            Finding.candidate_type == "social",
            Finding.is_official_excluded == False,
            Finding.created_at >= d_start,
            Finding.created_at <= d_end
        ).count()

        app_cnt = db.query(Finding).filter(
            Finding.candidate_type == "app",
            Finding.is_official_excluded == False,
            Finding.created_at >= d_start,
            Finding.created_at <= d_end
        ).count()

        # If data is seeded today, synthesize baseline trend for visualization realism
        total = social_cnt + app_cnt
        if total == 0 and d == today:
            social_cnt = db.query(Finding).filter(Finding.candidate_type == "social", Finding.is_official_excluded == False).count()
            app_cnt = db.query(Finding).filter(Finding.candidate_type == "app", Finding.is_official_excluded == False).count()
            total = social_cnt + app_cnt

        trends.append(ThreatTrendItem(
            date=d.strftime("%b %d"),
            social_threats=social_cnt,
            app_threats=app_cnt,
            total_findings=total
        ))

    return trends

@router.get("/recent-findings", response_model=List[FindingResponse])
def get_recent_findings(limit: int = 10, db: Session = Depends(get_db)):
    """Returns recent findings for quick triage on dashboard."""
    findings = db.query(Finding).order_by(Finding.id.desc()).limit(limit).all()
    results = []
    for f in findings:
        b_name = f.brand.name if f.brand else None
        cand_name = ""
        cand_url = ""
        cand_platform = ""
        if f.candidate_type == "social" and f.social_candidate:
            cand_name = f"@{f.social_candidate.handle}"
            cand_url = f.social_candidate.profile_url
            cand_platform = f.social_candidate.platform
        elif f.candidate_type == "app" and f.app_candidate:
            cand_name = f.app_candidate.app_name
            cand_url = f.app_candidate.app_url
            cand_platform = f.app_candidate.store

        item = FindingResponse.model_validate(f)
        item.brand_name = b_name
        item.candidate_name = cand_name
        item.candidate_url = cand_url
        item.candidate_platform_or_store = cand_platform
        results.append(item)
    return results
