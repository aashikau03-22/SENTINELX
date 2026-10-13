from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.report_service import generate_sector_report, generate_brand_report

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/sector/{sector_id}")
def get_sector_report_api(sector_id: str, db: Session = Depends(get_db)):
    """Generates detailed security summary for a selected industry sector."""
    report = generate_sector_report(db, sector_id)
    if not report:
        raise HTTPException(status_code=404, detail="Sector not found")
    return report

@router.get("/brand/{brand_id}")
def get_brand_report_api(brand_id: int, db: Session = Depends(get_db)):
    """Generates brand digital asset protection audit report."""
    report = generate_brand_report(db, brand_id)
    if not report:
        raise HTTPException(status_code=404, detail="Brand not found")
    return report
