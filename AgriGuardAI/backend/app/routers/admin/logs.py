"""Admin logs router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.agent_log import AgentLog
from app.models.user import User

router = APIRouter(prefix="/admin/logs", tags=["admin"])

@router.get("")
def get_agent_logs(
    animal_id: Optional[int] = None,
    limit: int = Query(50, le=500),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(AgentLog)
    if animal_id:
        q = q.filter(AgentLog.animal_id == animal_id)
    logs = q.order_by(AgentLog.created_at.desc()).limit(limit).all()
    return [{"id": l.id, "animal_id": l.animal_id, "agent_name": l.agent_name, "reasoning": l.reasoning, "execution_ms": l.execution_ms, "created_at": l.created_at.isoformat()} for l in logs]
