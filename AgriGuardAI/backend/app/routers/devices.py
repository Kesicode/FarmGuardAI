"""Devices router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_farmer
from app.models.device import Device
from app.models.user import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/devices", tags=["devices"])

class DeviceCreate(BaseModel):
    device_serial: str
    device_type: str = "collar"
    firmware_version: Optional[str] = None
    animal_id: Optional[int] = None

@router.get("")
def list_devices(current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    devices = db.query(Device).filter(Device.owner_id == current_user.id).all()
    return [{"id": d.id, "device_serial": d.device_serial, "status": d.status, "battery_pct": d.battery_pct, "last_seen": d.last_seen.isoformat() if d.last_seen else None, "animal_id": d.animal_id} for d in devices]

@router.post("", status_code=201)
def create_device(body: DeviceCreate, current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    d = Device(**body.model_dump(), owner_id=current_user.id)
    db.add(d); db.commit(); db.refresh(d)
    return {"id": d.id, "device_serial": d.device_serial}

class DeviceLink(BaseModel):
    animal_id: int

@router.post("/{device_id}/link")
def link_device(device_id: int, body: DeviceLink, current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    from fastapi import HTTPException
    d = db.get(Device, device_id)
    if not d or d.owner_id != current_user.id: raise HTTPException(404, "Device not found")
    d.animal_id = body.animal_id
    db.commit()
    return {"status": "linked"}
