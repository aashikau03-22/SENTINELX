from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Sector, Brand, Finding, SocialCandidate, AppCandidate
from app.seed.seed_data import seed_database

router = APIRouter(prefix="/demo", tags=["Demo Mode & Seeding"])

@router.post("/seed")
def seed_demo_data_endpoint(db: Session = Depends(get_db)):
    """
    Populates synthetic demonstration data across all 5 industry sectors.
    Completely idempotent: clicking repeatedly does not create duplicate entries.
    """
    seed_database(db)

    sectors_cnt = db.query(Sector).count()
    brands_cnt = db.query(Brand).count()
    social_cnt = db.query(SocialCandidate).count()
    app_cnt = db.query(AppCandidate).count()
    findings_cnt = db.query(Finding).count()
    excluded_cnt = db.query(Finding).filter(Finding.is_official_excluded == True).count()

    return {
        "status": "success",
        "message": "Demo data seeded successfully across all 5 sectors.",
        "summary": {
            "sectors_count": sectors_cnt,
            "brands_count": brands_cnt,
            "candidates_analyzed": social_cnt + app_cnt,
            "social_candidates": social_cnt,
            "app_candidates": app_cnt,
            "findings_count": findings_cnt,
            "official_excluded_count": excluded_cnt
        }
    }
