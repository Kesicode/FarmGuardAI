"""WebSocket router — Redis pub/sub backed."""
from fastapi import APIRouter, WebSocket, Query, Depends
from jose import JWTError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.animal import Animal
from app.services.ws_manager import ws_manager

router = APIRouter(tags=["websocket"])


async def _auth_ws(token: str, db: Session) -> User | None:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user = db.get(User, int(payload["sub"]))
        return user if user and user.is_active else None
    except (JWTError, ValueError):
        return None


@router.websocket("/ws/health/{animal_id}")
async def ws_health(
    websocket: WebSocket, animal_id: int,
    token: str = Query(...), db: Session = Depends(get_db),
):
    user = await _auth_ws(token, db)
    if not user:
        await websocket.close(code=4001)
        return
    animal = db.get(Animal, animal_id)
    if not animal or (animal.owner_id != user.id and user.role != "admin"):
        await websocket.close(code=4003)
        return
    await ws_manager.handle_health(websocket, animal_id)


@router.websocket("/ws/alerts/{user_id}")
async def ws_alerts(
    websocket: WebSocket, user_id: int,
    token: str = Query(...), db: Session = Depends(get_db),
):
    user = await _auth_ws(token, db)
    if not user or (user.id != user_id and user.role != "admin"):
        await websocket.close(code=4001)
        return
    await ws_manager.handle_alerts(websocket, user_id)


@router.websocket("/ws/agents")
async def ws_agents(
    websocket: WebSocket,
    token: str = Query(...), db: Session = Depends(get_db),
):
    user = await _auth_ws(token, db)
    if not user or user.role not in ("admin", "manager"):
        await websocket.close(code=4001)
        return
    await ws_manager.handle_agents(websocket)


@router.websocket("/ws/herd")
async def ws_herd(
    websocket: WebSocket,
    token: str = Query(...), db: Session = Depends(get_db),
):
    user = await _auth_ws(token, db)
    if not user:
        await websocket.close(code=4001)
        return
    await ws_manager.handle_herd(websocket)
