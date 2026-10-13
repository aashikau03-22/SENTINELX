from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import SocialCandidate, Brand, Finding
from app.schemas.schemas import SocialCandidateCreate, SocialCandidateResponse, FindingResponse
from app.services.detection_engine import analyze_social_candidate

router = APIRouter(prefix="/social", tags=["Social Threat Monitor"])

@router.get("/candidates")
def list_social_candidates(
    sector_id: Optional[str] = None,
    brand_id: Optional[int] = None,
    platform: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Lists social media candidates with their detection findings."""
    query = db.query(SocialCandidate)
    if sector_id:
        query = query.filter(SocialCandidate.sector_id == sector_id)
    if brand_id:
        query = query.filter(SocialCandidate.brand_id == brand_id)
    if platform:
        query = query.filter(SocialCandidate.platform.ilike(f"%{platform}%"))
    if search:
        query = query.filter(
            (SocialCandidate.display_name.ilike(f"%{search}%")) |
            (SocialCandidate.handle.ilike(f"%{search}%")) |
            (SocialCandidate.profile_url.ilike(f"%{search}%"))
        )

    candidates = query.order_by(SocialCandidate.id.desc()).all()
    results = []

    for c in candidates:
        finding = db.query(Finding).filter(
            Finding.candidate_type == "social",
            Finding.social_candidate_id == c.id
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
            "platform": c.platform,
            "display_name": c.display_name,
            "handle": c.handle,
            "profile_url": c.profile_url,
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
def analyze_social(payload: SocialCandidateCreate, db: Session = Depends(get_db)):
    """Analyzes a candidate social account against the selected brand."""
    brand = db.query(Brand).filter(Brand.id == payload.brand_id).first() if payload.brand_id else None
    if not brand:
        # Match by sector
        brand = db.query(Brand).filter(Brand.sector_id == payload.sector_id).first()
        if not brand:
            raise HTTPException(status_code=400, detail="No registered brand found for this sector to compare against.")

    candidate = SocialCandidate(
        platform=payload.platform,
        display_name=payload.display_name,
        handle=payload.handle,
        profile_url=payload.profile_url,
        description=payload.description or "",
        image_url=payload.image_url,
        brand_id=brand.id,
        sector_id=payload.sector_id,
        source_type=payload.source_type or "manual"
    )
    db.add(candidate)
    db.flush()

    finding = analyze_social_candidate(candidate, brand, db)

    return {
        "candidate": SocialCandidateResponse.model_validate(candidate),
        "finding": FindingResponse.model_validate(finding)
    }

@router.get("/candidates/{candidate_id}")
def get_social_candidate(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(SocialCandidate).filter(SocialCandidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Social candidate not found")
    finding = db.query(Finding).filter(Finding.candidate_type == "social", Finding.social_candidate_id == c.id).first()
    return {
        "candidate": SocialCandidateResponse.model_validate(c),
        "finding": FindingResponse.model_validate(finding) if finding else None
    }
