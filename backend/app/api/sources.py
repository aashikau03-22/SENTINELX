from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.models import DataSource, SocialCandidate, AppCandidate
from app.schemas.schemas import DataSourceResponse

router = APIRouter(prefix="/sources", tags=["Data Sources"])

@router.get("", response_model=List[DataSourceResponse])
def get_data_sources(db: Session = Depends(get_db)):
    """Lists configured ingest channels and API connectors."""
    return db.query(DataSource).all()

@router.get("/status")
def get_sources_status(db: Session = Depends(get_db)):
    """Returns platform monitoring mode, connector status, and candidate feed telemetry."""
    sources = db.query(DataSource).all()
    social_cnt = db.query(SocialCandidate).count()
    app_cnt = db.query(AppCandidate).count()

    return {
        "demo_mode": settings.DEMO_MODE,
        "banner_message": "DEMO MODE — Findings are based on synthetic demonstration data.",
        "active_sources_count": len([s for s in sources if "Active" in s.status]),
        "total_sources_count": len(sources),
        "total_candidates_ingested": social_cnt + app_cnt,
        "sources": [
            {
                "name": s.name,
                "type": s.source_type,
                "status": s.status,
                "is_live": s.is_live,
                "records_count": s.records_count,
                "last_sync": s.last_sync,
                "notes": s.notes
            } for s in sources
        ]
    }
