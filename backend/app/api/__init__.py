from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.sectors import router as sectors_router
from app.api.brands import router as brands_router
from app.api.social import router as social_router
from app.api.apps import router as apps_router
from app.api.findings import router as findings_router
from app.api.dashboard import router as dashboard_router
from app.api.graph import router as graph_router
from app.api.sources import router as sources_router
from app.api.reports import router as reports_router
from app.api.demo import router as demo_router
from app.api.detection import router as detection_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(sectors_router)
api_router.include_router(brands_router)
api_router.include_router(social_router)
api_router.include_router(apps_router)
api_router.include_router(findings_router)
api_router.include_router(dashboard_router)
api_router.include_router(graph_router)
api_router.include_router(sources_router)
api_router.include_router(reports_router)
api_router.include_router(demo_router)
api_router.include_router(detection_router)
