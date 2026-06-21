"""Animals CRUD router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import require_farmer
from app.models.animal import Animal
from app.models.user import User

router = APIRouter(prefix="/animals", tags=["animals"])


class AnimalCreate(BaseModel):
    name: str
    animal_type: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    weight_kg: Optional[float] = None
    gender: Optional[str] = None
    tag_number: Optional[str] = None
    notes: Optional[str] = None
    geofence_lat: Optional[float] = None
    geofence_lng: Optional[float] = None
    geofence_radius_m: Optional[float] = 500.0


@router.get("")
def list_animals(current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    animals = db.query(Animal).filter(Animal.owner_id == current_user.id).all()
    return [_serialize(a) for a in animals]


@router.post("", status_code=201)
def create_animal(body: AnimalCreate, current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    animal = Animal(**body.model_dump(), owner_id=current_user.id)
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return _serialize(animal)


@router.get("/{animal_id}")
def get_animal(animal_id: int, current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    animal = db.get(Animal, animal_id)
    if not animal or (animal.owner_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(404, "Animal not found")
    return _serialize(animal)


@router.patch("/{animal_id}")
def update_animal(animal_id: int, body: dict, current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    animal = db.get(Animal, animal_id)
    if not animal or animal.owner_id != current_user.id:
        raise HTTPException(404, "Animal not found")
    for k, v in body.items():
        if hasattr(animal, k):
            setattr(animal, k, v)
    db.commit()
    return _serialize(animal)


@router.delete("/{animal_id}", status_code=204)
def delete_animal(animal_id: int, current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    animal = db.get(Animal, animal_id)
    if not animal or animal.owner_id != current_user.id:
        raise HTTPException(404, "Animal not found")
    db.delete(animal)
    db.commit()


def _serialize(a: Animal) -> dict:
    return {
        "id": a.id, "name": a.name, "animal_type": a.animal_type,
        "breed": a.breed, "age_months": a.age_months, "weight_kg": a.weight_kg,
        "gender": a.gender, "tag_number": a.tag_number, "notes": a.notes,
        "health_score": a.health_score, "risk_level": a.risk_level,
        "last_health_update": a.last_health_update.isoformat() if a.last_health_update else None,
        "geofence_lat": a.geofence_lat, "geofence_lng": a.geofence_lng,
        "geofence_radius_m": a.geofence_radius_m,
        "device": {"id": a.device.id, "device_serial": a.device.device_serial, "status": a.device.status, "last_seen": a.device.last_seen.isoformat() if a.device and a.device.last_seen else None, "lat": a.device.lat, "lng": a.device.lng} if a.device else None,
        "created_at": a.created_at.isoformat(),
    }
