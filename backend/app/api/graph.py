from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import GraphResponse
from app.services.graph_service import build_threat_graph

router = APIRouter(prefix="/threat-graph", tags=["Threat Intelligence Graph"])

@router.get("", response_model=GraphResponse)
def get_threat_graph(
    sector_id: Optional[str] = None,
    brand_id: Optional[int] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Generates the interactive multi-sector Threat Intelligence Graph."""
    return build_threat_graph(db, sector_id=sector_id, brand_id=brand_id, severity=severity)
