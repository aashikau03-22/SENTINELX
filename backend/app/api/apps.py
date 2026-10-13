from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import AppCandidate, Brand, Finding
from app.schemas.schemas import AppCandidateCreate, AppCandidateResponse, FindingResponse
from app.services.detection_engine import analyze_app_candidate

router = APIRouter(prefix="/apps", tags=["App Threat Monitor"])

@router.get("/candidates")
def list_app_candidates(
    sector_id: Optional[str] = None,
    brand_id: Optional[int] = None,
    store: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Lists mobile app candidates with detection risk scores and publisher match info."""
    query = db.query(AppCandidate)
    if sector_id:
        query = query.filter(AppCandidate.sector_id == sector_id)
    if brand_id:
        query = query.filter(AppCandidate.brand_id == brand_id)
    if store:
        query = query.filter(AppCandidate.store.ilike(f"%{store}%"))
    if search:
        query = query.filter(
            (AppCandidate.app_name.ilike(f"%{search}%")) |
            (AppCandidate.package_id.ilike(f"%{search}%")) |
            (AppCandidate.developer_name.ilike(f"%{search}%"))
        )

    candidates = query.order_by(AppCandidate.id.desc()).all()
    results = []

    for c in candidates:
        finding = db.query(Finding).filter(
            Finding.candidate_type == "app",
            Finding.app_candidate_id == c.id
        ).first()

        if severity and (not finding or finding.severity != severity):
            continue
        if status and (not finding or finding.status != status):
            continue

        brand_name = c.brand_id and db.query(Brand.name).filter(Brand.id == c.brand_id).scalar()

        ai_pred = None
        if finding:
            for ev in finding.evidence:
                if ev.signal_name == "ML Fake Detection Classifier" and ev.evidence_metadata:
                    ai_pred = {
                        "prediction": ev.evidence_metadata.get("prediction"),
                        "is_fake": ev.evidence_metadata.get("is_fake"),
                        "confidence": ev.evidence_metadata.get("confidence"),
                        "fake_probability": ev.evidence_metadata.get("fake_probability"),
                        "genuine_probability": ev.evidence_metadata.get("genuine_probability"),
                        "sector_used": ev.evidence_metadata.get("sector_used")
                    }
                    break

        results.append({
            "id": c.id,
            "app_name": c.app_name,
            "store": c.store,
            "app_url": c.app_url,
            "package_id": c.package_id,
            "developer_name": c.developer_name,
            "description": c.description,
            "brand_id": c.brand_id,
            "brand_name": brand_name,
            "sector_id": c.sector_id,
            "source_type": c.source_type,
            "first_seen": c.first_seen,
            "last_seen": c.last_seen,
            "created_at": c.created_at,
            "finding": {
                "id": finding.id,
                "risk_score": finding.risk_score,
                "severity": finding.severity,
                "status": finding.status,
                "is_official_excluded": finding.is_official_excluded,
                "exclusion_reason": finding.exclusion_reason,
                "threat_category": finding.threat_category,
                "assigned_analyst": finding.assigned_analyst,
                "ai_prediction": ai_pred
            } if finding else None
        })

    total = len(results)
    paginated = results[offset : offset + limit]
    return {
        "total": total,
        "items": paginated,
        "limit": limit,
        "offset": offset
    }

@router.post("/analyze", status_code=status.HTTP_201_CREATED)
def analyze_app(payload: AppCandidateCreate, db: Session = Depends(get_db)):
    """Analyzes a mobile application candidate against the selected brand."""
    brand = db.query(Brand).filter(Brand.id == payload.brand_id).first() if payload.brand_id else None
    if not brand:
        brand = db.query(Brand).filter(Brand.sector_id == payload.sector_id).first()
        if not brand:
            raise HTTPException(status_code=400, detail="No registered brand found for this sector to compare against.")

    candidate = AppCandidate(
        app_name=payload.app_name,
        store=payload.store,
        app_url=payload.app_url,
        package_id=payload.package_id,
        developer_name=payload.developer_name,
        description=payload.description or "",
        icon_url=payload.icon_url,
        brand_id=brand.id,
        sector_id=payload.sector_id,
        source_type=payload.source_type or "manual"
    )
    db.add(candidate)
    db.flush()

    finding = analyze_app_candidate(candidate, brand, db)

    return {
        "candidate": AppCandidateResponse.model_validate(candidate),
        "finding": FindingResponse.model_validate(finding)
    }

@router.get("/candidates/{candidate_id}")
def get_app_candidate(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(AppCandidate).filter(AppCandidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="App candidate not found")
    finding = db.query(Finding).filter(Finding.candidate_type == "app", Finding.app_candidate_id == c.id).first()
    return {
        "candidate": AppCandidateResponse.model_validate(c),
        "finding": FindingResponse.model_validate(finding) if finding else None
    }
