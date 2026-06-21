"""Recommendations router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_farmer
from app.models.recommendation import Recommendation
from app.models.user import User

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("/{animal_id}")
def get_recommendations(animal_id: int, limit: int = Query(10, le=50), current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    recs = db.query(Recommendation).filter(Recommendation.animal_id == animal_id).order_by(Recommendation.created_at.desc()).limit(limit).all()
    return [{"id": r.id, "recommendation_text": r.recommendation_text, "priority": r.priority, "action_type": r.action_type, "status": r.status, "created_at": r.created_at.isoformat()} for r in recs]

@router.patch("/{rec_id}/status")
def update_status(rec_id: int, status: str, current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    r = db.get(Recommendation, rec_id)
    if r: r.status = status; db.commit()
    return {"status": "updated"}
