from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import (
    Finding, FindingEvidence, ReviewNote, ReviewHistory, Brand,
    ApprovedAsset, SocialCandidate, AppCandidate
)
from app.schemas.schemas import (
    FindingResponse, FindingDetailResponse, FindingStatusUpdate,
    ReviewNoteCreate, ReviewNoteResponse
)
from app.services.report_service import generate_findings_csv

router = APIRouter(prefix="/findings", tags=["Findings & Investigations"])

@router.get("", response_model=List[FindingResponse])
def get_findings(
    sector_id: Optional[str] = None,
    brand_id: Optional[int] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    candidate_type: Optional[str] = None,
    exclude_official: bool = False,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Lists findings with comprehensive filtering for analyst triage."""
    query = db.query(Finding)
    if sector_id:
        query = query.filter(Finding.sector_id == sector_id)
    if brand_id:
        query = query.filter(Finding.brand_id == brand_id)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    if candidate_type:
        query = query.filter(Finding.candidate_type == candidate_type)
    if exclude_official:
        query = query.filter(Finding.is_official_excluded == False)

    findings = query.order_by(Finding.id.desc()).offset(offset).limit(limit).all()
    results = []

    for f in findings:
        b_name = f.brand.name if f.brand else None
        cand_name = ""
        cand_url = ""
        cand_platform = ""

        if f.candidate_type == "social" and f.social_candidate:
            cand_name = f"@{f.social_candidate.handle} ({f.social_candidate.display_name})"
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

@router.get("/export.csv")
def export_findings_csv(
    sector_id: Optional[str] = None,
    brand_id: Optional[int] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    candidate_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Exports filtered investigation findings into standard CSV format."""
    csv_content = generate_findings_csv(db, sector_id, brand_id, severity, status, candidate_type)
    filename = f"sentinelx_findings_{sector_id or 'all'}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{finding_id}", response_model=FindingDetailResponse)
def get_finding_detail(finding_id: int, db: Session = Depends(get_db)):
    """Fetch complete finding evidence breakdown, notes, and audit history."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    b_name = finding.brand.name if finding.brand else None
    cand_name = ""
    cand_url = ""
    cand_platform = ""

    if finding.candidate_type == "social" and finding.social_candidate:
        cand_name = f"@{finding.social_candidate.handle} ({finding.social_candidate.display_name})"
        cand_url = finding.social_candidate.profile_url
        cand_platform = finding.social_candidate.platform
    elif finding.candidate_type == "app" and finding.app_candidate:
        cand_name = finding.app_candidate.app_name
        cand_url = finding.app_candidate.app_url
        cand_platform = finding.app_candidate.store

    resp = FindingDetailResponse.model_validate(finding)
    resp.brand_name = b_name
    resp.candidate_name = cand_name
    resp.candidate_url = cand_url
    resp.candidate_platform_or_store = cand_platform
    return resp

@router.patch("/{finding_id}/status", response_model=FindingDetailResponse)
def update_finding_status(
    finding_id: int,
    payload: FindingStatusUpdate,
    db: Session = Depends(get_db)
):
    """Updates case status, adds audit history, and optionally whitelists false positives."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    old_status = finding.status
    finding.status = payload.status
    finding.assigned_analyst = payload.analyst

    # Log audit history
    history = ReviewHistory(
        finding_id=finding.id,
        previous_status=old_status,
        new_status=payload.status,
        analyst=payload.analyst,
        notes=payload.notes or f"Status changed from {old_status} to {payload.status}."
    )
    db.add(history)

    # If note is provided, also add as review note
    if payload.notes:
        db.add(ReviewNote(
            finding_id=finding.id,
            author=payload.analyst,
            content=payload.notes
        ))

    # Auto-whitelist for false positives
    if payload.status == "False Positive" and payload.add_to_approved_assets:
        if finding.candidate_type == "social" and finding.social_candidate:
            ident = finding.social_candidate.handle
            existing_appr = db.query(ApprovedAsset).filter(
                ApprovedAsset.brand_id == finding.brand_id,
                ApprovedAsset.identifier == ident
            ).first()
            if not existing_appr:
                db.add(ApprovedAsset(
                    brand_id=finding.brand_id,
                    asset_type="social",
                    identifier=ident,
                    reason=payload.notes or "Analyst marked as False Positive",
                    approved_by=payload.analyst
                ))
        elif finding.candidate_type == "app" and finding.app_candidate:
            ident = finding.app_candidate.package_id
            existing_appr = db.query(ApprovedAsset).filter(
                ApprovedAsset.brand_id == finding.brand_id,
                ApprovedAsset.identifier == ident
            ).first()
            if not existing_appr:
                db.add(ApprovedAsset(
                    brand_id=finding.brand_id,
                    asset_type="app",
                    identifier=ident,
                    reason=payload.notes or "Analyst marked as False Positive",
                    approved_by=payload.analyst
                ))

    db.commit()
    db.refresh(finding)
    return get_finding_detail(finding_id, db)

@router.post("/{finding_id}/notes", response_model=ReviewNoteResponse, status_code=status.HTTP_201_CREATED)
def add_finding_note(finding_id: int, payload: ReviewNoteCreate, db: Session = Depends(get_db)):
    """Appends an analyst note to the case dossier."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    note = ReviewNote(
        finding_id=finding.id,
        author=payload.author,
        content=payload.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
