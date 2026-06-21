"""Admin animals router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.animal import Animal
from app.models.user import User

router = APIRouter(prefix="/admin/animals", tags=["admin"])

@router.get("")
def list_all_animals(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    animals = db.query(Animal).all()
    return [{"id": a.id, "name": a.name, "animal_type": a.animal_type, "owner_id": a.owner_id, "health_score": a.health_score, "risk_level": a.risk_level} for a in animals]
