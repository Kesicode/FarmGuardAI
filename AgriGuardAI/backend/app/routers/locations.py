"""Locations router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_farmer
from app.models.location import Location
from app.models.user import User

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get("/{animal_id}")
def get_locations(animal_id: int, limit: int = Query(100, le=500), current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    locs = db.query(Location).filter(Location.animal_id == animal_id).order_by(Location.recorded_at.desc()).limit(limit).all()
    return [{"lat": l.lat, "lng": l.lng, "recorded_at": l.recorded_at.isoformat()} for l in locs]
