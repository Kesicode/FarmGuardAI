"""Admin alerts router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.alert import Alert
from app.models.user import User

router = APIRouter(prefix="/admin/alerts", tags=["admin"])

@router.get("")
def list_all_alerts(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(100).all()
    return [{"id": a.id, "animal_id": a.animal_id, "alert_type": a.alert_type, "severity": a.severity, "message": a.message, "is_resolved": a.is_resolved} for a in alerts]
