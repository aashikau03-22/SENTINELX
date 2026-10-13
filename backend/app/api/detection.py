from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import FakeDetectionRequest, FakeDetectionResponse
from app.services.ml_model_service import predict_fake_detection

router = APIRouter(prefix="/detection", tags=["ML Fake Detection Model"])

@router.post("/predict", response_model=FakeDetectionResponse, status_code=status.HTTP_200_OK)
def predict_fake_text(payload: FakeDetectionRequest):
    """
    ML-Powered Fake / Genuine Detection API.
    Uses the trained joblib model pipeline (fake_detection_model.pkl).
    
    Accepts:
    - text: candidate bio, app description, suspicious offer text, etc.
    - sector: target sector (banking, ecommerce, telecom, government_digital_services, etc.)
    
    Returns:
    - prediction: 'fake' or 'genuine'
    - is_fake: True if deceptive, False if genuine
    - confidence: float score
    - fake_probability & genuine_probability
    - sector_used: normalized sector mapped to model encoder
    """
    try:
        result = predict_fake_detection(text=payload.text, sector=payload.sector)
        return FakeDetectionResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run fake detection model: {str(e)}"
        )
