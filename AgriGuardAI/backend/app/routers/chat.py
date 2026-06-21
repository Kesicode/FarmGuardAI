"""Chat router — RAG + Gemini conversational AI agent."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone
import json

from app.core.database import get_db, SessionLocal
from app.core.dependencies import require_farmer
from app.models.user import User
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.animal import Animal
from app.services.rag_service import search_similar
from app.core.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """You are AgriGuard AI, a veterinary assistant for livestock farmers.
You have access to real-time health data, alerts, predictions, and recommendations from AgriGuard sensors.
Answer questions about animal health, explain alerts, interpret health scores, and give actionable advice.
Be concise, warm, and professional. Always cite the data source when referencing specific animals.
If you're uncertain, say so rather than guessing. Never suggest specific medications without vet approval."""


class MessageRequest(BaseModel):
    content: str
    animal_id: int | None = None


@router.post("/sessions", status_code=201)
def create_session(current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    session = ChatSession(user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.session_id, "id": session.id}


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    body: MessageRequest,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")

    # Save user message
    user_msg = ChatMessage(session_id=session.id, role="user", content=body.content)
    db.add(user_msg)
    db.commit()

    # RAG: retrieve relevant context
    context_chunks = await search_similar(db, body.content, animal_id=body.animal_id, limit=4)

    # Build live DB context for mentioned animals
    db_context = _build_db_context(db, current_user.id, body.content, body.animal_id)

    # Build full prompt
    context_text = "\n\n".join(context_chunks) if context_chunks else "No historical health events found."
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at.asc()).limit(10).all()

    full_prompt = _build_prompt(body.content, context_text, db_context, history)

    session_id_int = session.id

    # Stream from Gemini
    async def generate():
        with SessionLocal() as gen_db:
            if not settings.GEMINI_API_KEY:
                response_text = _fallback_response(body.content, gen_db, current_user.id)
                yield f"data: {json.dumps({'text': response_text})}\n\n"
                _save_assistant_message(gen_db, session_id_int, response_text, context_chunks)
                return

            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL, system_instruction=SYSTEM_PROMPT)

            full_response = ""
            try:
                async for chunk in await model.generate_content_async(full_prompt, stream=True):
                    if chunk.text:
                        full_response += chunk.text
                        yield f"data: {json.dumps({'text': chunk.text})}\n\n"
            except Exception as e:
                full_response = f"I encountered an error: {str(e)[:100]}"
                yield f"data: {json.dumps({'text': full_response})}\n\n"

            _save_assistant_message(gen_db, session_id_int, full_response, context_chunks)
            sess = gen_db.query(ChatSession).get(session_id_int)
            if sess:
                sess.last_active = datetime.now(timezone.utc)
                gen_db.commit()
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/sessions/{session_id}/messages")
def get_history(
    session_id: str,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at.asc()).all()
    return [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in messages]


def _build_db_context(db: Session, user_id: int, query: str, animal_id: int | None) -> str:
    animals = db.query(Animal).filter(Animal.owner_id == user_id).all()
    lines = ["Current herd status:"]
    for a in animals:
        if animal_id and a.id != animal_id:
            continue
        lines.append(
            f"- {a.name} ({a.animal_type}): health_score={a.health_score or 'N/A'}, "
            f"risk={a.risk_level or 'unknown'}"
        )
    return "\n".join(lines)


def _build_prompt(query: str, context: str, db_context: str, history: list) -> str:
    history_text = "\n".join([f"{m.role.upper()}: {m.content}" for m in history[-6:]])
    return f"""Conversation history:
{history_text}

Live farm data:
{db_context}

Relevant health history (from knowledge base):
{context}

USER: {query}
ASSISTANT:"""


def _save_assistant_message(db, session_id, content, context_chunks):
    db.add(ChatMessage(
        session_id=session_id, role="assistant", content=content,
        context_used={"chunks": context_chunks[:2]},
    ))
    db.commit()


def _fallback_response(query: str, db: Session, user_id: int) -> str:
    animals = db.query(Animal).filter(Animal.owner_id == user_id).all()
    if "risk" in query.lower() or "critical" in query.lower():
        at_risk = [a for a in animals if a.risk_level in ("high", "critical")]
        if at_risk:
            names = ", ".join(a.name for a in at_risk)
            return f"Animals currently at elevated risk: {names}. I recommend checking their latest health readings and following the agent recommendations."
        return "No animals are currently at high or critical risk."
    if animals:
        healthy = sum(1 for a in animals if a.risk_level == "low")
        return f"Your herd has {len(animals)} animals. {healthy} are in the low-risk (healthy) category. Configure a Gemini API key for full AI analysis."
    return "No animals found in your farm. Please register animals first."
