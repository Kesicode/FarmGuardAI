"""Analytics router — herd stats, risk distribution, trend data."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.core.dependencies import require_farmer
from app.models.animal import Animal
from app.models.health_reading import HealthReading
from app.models.alert import Alert
from app.models.prediction import Prediction
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/herd-health")
def herd_health(current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    animals = db.query(Animal).filter(Animal.owner_id == current_user.id).all()
    if not animals:
        return {"total": 0, "avg_health_score": 0, "risk_distribution": {}}

    scored = [a for a in animals if a.health_score is not None]
    avg = sum(a.health_score for a in scored) / len(scored) if scored else 0

    risk_dist = {"low": 0, "medium": 0, "high": 0, "critical": 0, "unknown": 0}
    for a in animals:
        risk_dist[a.risk_level if a.risk_level in risk_dist else "unknown"] += 1

    return {
        "total_animals": len(animals),
        "avg_health_score": round(avg, 1),
        "risk_distribution": risk_dist,
        "animals_at_risk": [
            {"id": a.id, "name": a.name, "animal_type": a.animal_type,
             "health_score": a.health_score, "risk_level": a.risk_level}
            for a in animals if a.risk_level in ("high", "critical")
        ],
    }


@router.get("/trend/{animal_id}")
def health_trend(
    animal_id: int, hours: int = 24,
    current_user: User = Depends(require_farmer), db: Session = Depends(get_db)
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    readings = (
        db.query(HealthReading)
        .filter(HealthReading.animal_id == animal_id, HealthReading.recorded_at >= since)
        .order_by(HealthReading.recorded_at.asc())
        .all()
    )
    return {
        "animal_id": animal_id,
        "data": [
            {
                "timestamp": r.recorded_at.isoformat(),
                "temperature": r.temperature,
                "heart_rate": r.heart_rate,
                "health_score": r.health_score,
                "activity_classification": r.activity_classification,
                "health_alert_class": r.health_alert_class,
            }
            for r in readings
        ],
    }


@router.get("/predictions/summary")
def predictions_summary(
    days: int = 7,
    current_user: User = Depends(require_farmer), db: Session = Depends(get_db)
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    animal_ids = [a.id for a in db.query(Animal).filter(Animal.owner_id == current_user.id).all()]
    preds = db.query(Prediction).filter(
        Prediction.animal_id.in_(animal_ids),
        Prediction.predicted_at >= since,
    ).all()

    summary: dict[str, int] = {}
    for p in preds:
        summary[p.prediction_type] = summary.get(p.prediction_type, 0) + 1

    return {"period_days": days, "total_predictions": len(preds), "by_type": summary}
