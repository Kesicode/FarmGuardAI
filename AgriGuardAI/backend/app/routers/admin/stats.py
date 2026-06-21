"""Admin stats router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.animal import Animal
from app.models.device import Device
from app.models.health_reading import HealthReading

router = APIRouter(prefix="/admin/stats", tags=["admin"])

@router.get("")
def system_stats(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return {
        "users": db.query(func.count(User.id)).scalar(),
        "animals": db.query(func.count(Animal.id)).scalar(),
        "devices": db.query(func.count(Device.id)).scalar(),
        "readings": db.query(func.count(HealthReading.id)).scalar(),
    }
