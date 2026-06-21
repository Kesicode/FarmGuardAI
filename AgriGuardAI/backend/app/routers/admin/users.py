"""Admin users router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User

router = APIRouter(prefix="/admin/users", tags=["admin"])

@router.get("")
def list_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role, "is_active": u.is_active, "farm_name": u.farm_name, "created_at": u.created_at.isoformat()} for u in users]
