from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Sector, SectorRule, Brand, Finding, SocialCandidate, AppCandidate
from app.schemas.schemas import (
    SectorResponse, SectorWithStatsResponse, SectorCreate, SectorUpdate,
    SectorRuleResponse, SectorRuleUpdate
)

router = APIRouter(prefix="/sectors", tags=["Sectors"])

@router.get("", response_model=List[SectorWithStatsResponse])
def get_all_sectors(db: Session = Depends(get_db)):
    """Fetch all active sectors with aggregated statistics."""
    sectors = db.query(Sector).filter(Sector.is_active == True).all()
    results = []

    for s in sectors:
        brands_cnt = db.query(Brand).filter(Brand.sector_id == s.id).count()
        findings_query = db.query(Finding).filter(Finding.sector_id == s.id)
        findings_cnt = findings_query.count()
        high_critical_cnt = findings_query.filter(Finding.severity.in_(["High", "Critical"])).count()
        social_cnt = db.query(SocialCandidate).filter(SocialCandidate.sector_id == s.id).count()
        app_cnt = db.query(AppCandidate).filter(AppCandidate.sector_id == s.id).count()

        results.append(SectorWithStatsResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            icon=s.icon,
            threat_categories=s.threat_categories or [],
            recommended_checklist=s.recommended_checklist or [],
            is_custom=s.is_custom,
            is_active=s.is_active,
            created_at=s.created_at,
            updated_at=s.updated_at,
            rules=[SectorRuleResponse.model_validate(r) for r in s.rules],
            brands_count=brands_cnt,
            findings_count=findings_cnt,
            high_critical_count=high_critical_cnt,
            social_candidates_count=social_cnt,
            app_candidates_count=app_cnt
        ))
    return results

@router.get("/{sector_id}", response_model=SectorWithStatsResponse)
def get_sector(sector_id: str, db: Session = Depends(get_db)):
    """Fetch detailed configuration and stats for a single sector."""
    s = db.query(Sector).filter(Sector.id == sector_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sector not found")

    brands_cnt = db.query(Brand).filter(Brand.sector_id == s.id).count()
    findings_query = db.query(Finding).filter(Finding.sector_id == s.id)
    findings_cnt = findings_query.count()
    high_critical_cnt = findings_query.filter(Finding.severity.in_(["High", "Critical"])).count()
    social_cnt = db.query(SocialCandidate).filter(SocialCandidate.sector_id == s.id).count()
    app_cnt = db.query(AppCandidate).filter(AppCandidate.sector_id == s.id).count()

    return SectorWithStatsResponse(
        id=s.id,
        name=s.name,
        description=s.description,
        icon=s.icon,
        threat_categories=s.threat_categories or [],
        recommended_checklist=s.recommended_checklist or [],
        is_custom=s.is_custom,
        is_active=s.is_active,
        created_at=s.created_at,
        updated_at=s.updated_at,
        rules=[SectorRuleResponse.model_validate(r) for r in s.rules],
        brands_count=brands_cnt,
        findings_count=findings_cnt,
        high_critical_count=high_critical_cnt,
        social_candidates_count=social_cnt,
        app_candidates_count=app_cnt
    )

@router.post("", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def create_custom_sector(payload: SectorCreate, db: Session = Depends(get_db)):
    """Custom Sector Builder: Registers a new custom sector with rules."""
    slug_id = payload.id.lower().strip().replace(" ", "_")
    existing = db.query(Sector).filter((Sector.id == slug_id) | (Sector.name == payload.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="A sector with this ID or name already exists.")

    sector = Sector(
        id=slug_id,
        name=payload.name,
        description=payload.description,
        icon=payload.icon or "Shield",
        threat_categories=payload.threat_categories or ["Brand Impersonation", "Fraudulent Channels"],
        recommended_checklist=payload.recommended_checklist or ["Review profile ownership", "Verify developer ID"],
        is_custom=True,
        is_active=payload.is_active
    )
    db.add(sector)
    db.flush()

    # Add initial rules or default detection rules
    if payload.initial_rules:
        for r in payload.initial_rules:
            db.add(SectorRule(
                sector_id=sector.id,
                rule_name=r.rule_name,
                rule_code=r.rule_code,
                description=r.description,
                weight=r.weight,
                threshold=r.threshold,
                is_enabled=r.is_enabled
            ))
    else:
        # Default baseline rules
        db.add(SectorRule(sector_id=sector.id, rule_name="Lookalike Brand Name", rule_code=f"{slug_id.upper()}_NAME_SIMILARITY", description="Detects fuzzy name similarity.", weight=1.2, threshold=0.75))
        db.add(SectorRule(sector_id=sector.id, rule_name="Publisher Mismatch", rule_code=f"{slug_id.upper()}_PUB_MISMATCH", description="Flags developer variations.", weight=1.4, threshold=0.70))

    db.commit()
    db.refresh(sector)
    return sector

@router.patch("/{sector_id}", response_model=SectorResponse)
def update_sector(sector_id: str, payload: SectorUpdate, db: Session = Depends(get_db)):
    """Updates sector metadata."""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")

    if payload.name is not None:
        sector.name = payload.name
    if payload.description is not None:
        sector.description = payload.description
    if payload.icon is not None:
        sector.icon = payload.icon
    if payload.threat_categories is not None:
        sector.threat_categories = payload.threat_categories
    if payload.recommended_checklist is not None:
        sector.recommended_checklist = payload.recommended_checklist
    if payload.is_active is not None:
        sector.is_active = payload.is_active

    db.commit()
    db.refresh(sector)
    return sector

@router.delete("/{sector_id}")
def delete_custom_sector(sector_id: str, db: Session = Depends(get_db)):
    """Deletes a custom sector if no protected brands exist."""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    if not sector.is_custom:
        raise HTTPException(status_code=400, detail="Cannot delete default system sectors.")

    brands_count = db.query(Brand).filter(Brand.sector_id == sector_id).count()
    if brands_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete sector with {brands_count} active brands. Please delete or reassign brands first.")

    db.delete(sector)
    db.commit()
    return {"message": f"Sector '{sector_id}' deleted successfully"}

@router.patch("/{sector_id}/rules/{rule_id}", response_model=SectorRuleResponse)
def update_sector_rule(sector_id: str, rule_id: int, payload: SectorRuleUpdate, db: Session = Depends(get_db)):
    """Updates a sector detection rule's threshold, weight, or enabled status."""
    rule = db.query(SectorRule).filter(SectorRule.id == rule_id, SectorRule.sector_id == sector_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    if payload.weight is not None:
        rule.weight = payload.weight
    if payload.threshold is not None:
        rule.threshold = payload.threshold
    if payload.is_enabled is not None:
        rule.is_enabled = payload.is_enabled

    db.commit()
    db.refresh(rule)
    return rule
