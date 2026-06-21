"""Admin devices router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.device import Device
from app.models.user import User

router = APIRouter(prefix="/admin/devices", tags=["admin"])

@router.get("")
def list_all_devices(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    return [{"id": d.id, "device_serial": d.device_serial, "status": d.status, "owner_id": d.owner_id, "animal_id": d.animal_id} for d in devices]
