import os
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import pandas as pd

# Path to fake_detection_model.pkl directly inside backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BACKEND_DIR / "fake_detection_model.pkl"

_model = None

# Sector mapping to handle frontend IDs and variants
SECTOR_MAP = {
    "banking": "banking",
    "banking_fintech": "banking",
    "ecommerce": "ecommerce",
    "e-commerce": "ecommerce",
    "online_shopping": "online_shopping",
    "food_tech": "food_tech",
    "telecom": "telecom",
    "telecom_mobile": "telecom",
    "government": "government_digital_services",
    "government_digital_services": "government_digital_services",
    "education": "ecommerce",  # Fallback for education if not in trained vocabulary
}

def get_ml_model():
    """Loads the joblib model singleton from fake_detection_model.pkl."""
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"ML Model file not found at {MODEL_PATH}")
        _model = joblib.load(str(MODEL_PATH))
    return _model

def normalize_sector_for_model(sector: str) -> str:
    """Normalizes input sector to match the model's trained OneHotEncoder categories."""
    if not sector:
        return "banking"
    s = sector.strip().lower().replace("-", "_").replace(" ", "_").replace("&", "_")
    for key, val in SECTOR_MAP.items():
        if key in s:
            return val
    return "banking"

def predict_fake_detection(text: str, sector: str) -> Dict[str, Any]:
    """
    Executes fake vs genuine prediction using the loaded joblib pipeline.
    
    Returns:
        {
            "prediction": "fake" | "genuine",
            "is_fake": bool,
            "confidence": float (0.0 to 1.0),
            "fake_probability": float (0.0 to 1.0),
            "genuine_probability": float (0.0 to 1.0),
            "sector_used": str,
            "model_loaded": True
        }
    """
    model = get_ml_model()
    norm_sector = normalize_sector_for_model(sector)
    
    # Model pipeline expects DataFrame with columns ['sector', 'text']
    df = pd.DataFrame([{"sector": norm_sector, "text": text or ""}])
    
    prediction = str(model.predict(df)[0])
    
    fake_prob = 0.5
    gen_prob = 0.5
    confidence = 0.5
    
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(df)[0]
        classes = list(model.classes_)
        if "fake" in classes:
            fake_prob = float(probs[classes.index("fake")])
        if "genuine" in classes:
            gen_prob = float(probs[classes.index("genuine")])
        
        confidence = fake_prob if prediction == "fake" else gen_prob
        
    return {
        "prediction": prediction,
        "is_fake": prediction.lower() == "fake",
        "confidence": round(confidence, 4),
        "fake_probability": round(fake_prob, 4),
        "genuine_probability": round(gen_prob, 4),
        "sector_used": norm_sector,
        "model_loaded": True
    }
