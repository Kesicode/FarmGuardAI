"""Alerts router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_farmer
from app.models.alert import Alert
from app.models.user import User
from datetime import datetime, timezone

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("")
def list_alerts(
    limit: int = Query(20, le=100), is_resolved: bool = False,
    current_user: User = Depends(require_farmer), db: Session = Depends(get_db),
):
    from app.models.animal import Animal
    animal_ids = [a.id for a in db.query(Animal).filter(Animal.owner_id == current_user.id).all()]
    alerts = db.query(Alert).filter(Alert.animal_id.in_(animal_ids), Alert.is_resolved == is_resolved).order_by(Alert.created_at.desc()).limit(limit).all()
    return [{"id": a.id, "animal_id": a.animal_id, "alert_type": a.alert_type, "severity": a.severity, "message": a.message, "is_resolved": a.is_resolved, "created_at": a.created_at.isoformat()} for a in alerts]

@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: int, current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    a = db.get(Alert, alert_id)
    if a: a.is_resolved = True; a.resolved_at = datetime.now(timezone.utc); db.commit()
    return {"status": "resolved"}
