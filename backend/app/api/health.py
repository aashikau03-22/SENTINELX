from fastapi import APIRouter
from app.core.config import settings
from app.services.ml_model_service import MODEL_PATH, get_ml_model

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    ml_loaded = False
    try:
        model = get_ml_model()
        ml_loaded = model is not None
    except Exception:
        ml_loaded = False

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "ai_model": {
            "loaded": ml_loaded,
            "filename": "fake_detection_model.pkl",
            "exists_on_disk": MODEL_PATH.exists()
        }
    }
