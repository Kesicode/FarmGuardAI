from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.device import Device

bearer = HTTPBearer()


def _get_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = db.get(User, int(payload["sub"]))
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User inactive or not found")
        return user
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


def require_farmer(user: User = Depends(_get_user_from_token)) -> User:
    if user.role not in ("farmer", "admin", "manager", "vet"):
        raise HTTPException(status_code=403, detail="Farmer access required")
    return user


def require_admin(user: User = Depends(_get_user_from_token)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_vet(user: User = Depends(_get_user_from_token)) -> User:
    if user.role not in ("vet", "admin"):
        raise HTTPException(status_code=403, detail="Veterinarian access required")
    return user


def require_manager(user: User = Depends(_get_user_from_token)) -> User:
    if user.role not in ("manager", "admin"):
        raise HTTPException(status_code=403, detail="Manager access required")
    return user


def get_device_by_serial(
    x_device_serial: str = Header(...),
    db: Session = Depends(get_db),
) -> Device:
    device = db.query(Device).filter(Device.device_serial == x_device_serial).first()
    if not device:
        raise HTTPException(status_code=401, detail="Unknown device serial")
    return device
