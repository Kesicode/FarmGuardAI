"""Predictions router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_farmer
from app.models.prediction import Prediction
from app.models.user import User

router = APIRouter(prefix="/predictions", tags=["predictions"])

@router.get("/{animal_id}")
def get_predictions(animal_id: int, limit: int = Query(20, le=100), current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    preds = db.query(Prediction).filter(Prediction.animal_id == animal_id).order_by(Prediction.predicted_at.desc()).limit(limit).all()
    return [{"id": p.id, "prediction_type": p.prediction_type, "confidence": p.confidence, "reasoning": p.reasoning, "predicted_at": p.predicted_at.isoformat(), "is_confirmed": p.is_confirmed} for p in preds]
