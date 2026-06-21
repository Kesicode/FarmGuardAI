"""Health readings router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_farmer
from app.models.health_reading import HealthReading
from app.models.animal import Animal
from app.models.user import User

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/{animal_id}")
def get_health_readings(
    animal_id: int,
    limit: int = Query(50, le=500),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
):
    readings = (
        db.query(HealthReading)
        .filter(HealthReading.animal_id == animal_id)
        .order_by(HealthReading.recorded_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize(r) for r in readings]


@router.get("/{animal_id}/latest")
def get_latest(animal_id: int, current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    r = db.query(HealthReading).filter(HealthReading.animal_id == animal_id).order_by(HealthReading.recorded_at.desc()).first()
    return _serialize(r) if r else None


def _serialize(r: HealthReading) -> dict:
    return {
        "id": r.id, "animal_id": r.animal_id,
        "temperature": r.temperature, "heart_rate": r.heart_rate,
        "spo2": r.spo2, "activity_level": r.activity_level,
        "activity_classification": r.activity_classification,
        "health_alert_class": r.health_alert_class,
        "health_score": r.health_score, "behavioral_score": r.behavioral_score,
        "anomaly_detected": r.anomaly_detected, "agent_processed": r.agent_processed,
        "lat": r.lat, "lng": r.lng, "source": r.source,
        "recorded_at": r.recorded_at.isoformat(),
    }
