"""
RAG Service — pgvector-based retrieval.
IMPORTANT: Only embeds agent-generated summaries, not raw sensor readings.
should_embed() gates all embedding calls.
"""
import json
from sqlalchemy.orm import Session
from app.models.knowledge_embedding import KnowledgeEmbedding
from app.models.animal import Animal
from app.core.config import settings


async def get_embedding(text: str) -> list[float]:
    """Get embedding vector from Gemini embedding model."""
    if not settings.GEMINI_API_KEY:
        # Return zero vector if no API key (graceful degradation)
        return [0.0] * settings.EMBED_DIMENSIONS

    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    result = genai.embed_content(
        model=settings.GEMINI_EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]


def should_embed(state: dict) -> bool:
    """Only embed when something meaningful happened."""
    return (
        state.get("anomaly_detected") or
        state.get("risk_level") in ("medium", "high", "critical") or
        bool(state.get("predictions")) or
        bool(state.get("alerts_to_fire"))
    )


def build_embed_text(state: dict, animal_name: str, animal_type: str) -> str:
    """Build natural language summary for embedding — NOT raw sensor values."""
    parts = [f"{animal_type.title()} '{animal_name}' — health event recorded."]
    parts.append(f"Health score: {state.get('health_score', 0):.0f}/100. Risk level: {state.get('risk_level', 'unknown')}.")

    if state.get("behavior_summary"):
        parts.append(f"Behavior: {state['behavior_summary']}")

    if state.get("health_factors"):
        parts.append(f"Health factors: {'; '.join(state['health_factors'][:3])}")

    if state.get("predictions"):
        pred = state["predictions"][0]
        parts.append(
            f"Predicted condition: {pred['type'].replace('_',' ')} "
            f"({pred['confidence']*100:.0f}% confidence). "
            f"Reasoning: {pred['reasoning']}"
        )

    if state.get("recommendations"):
        rec = state["recommendations"][0]
        parts.append(f"Recommended action: {rec['text']} (priority: {rec['priority']})")

    return " ".join(parts)


async def embed_agent_output(db: Session, state: dict, animal: Animal) -> None:
    """Embed agent summary if warranted. Called from db_write node."""
    if not should_embed(state):
        return
    text = build_embed_text(state, animal.name, animal.animal_type)
    embedding = await get_embedding(text)
    db.add(KnowledgeEmbedding(
        content=text,
        embedding=embedding,
        source_type="health_event",
        animal_id=animal.id,
    ))
    db.commit()


async def search_similar(db: Session, query: str, animal_id: int | None = None, limit: int = 5) -> list[str]:
    """Retrieve relevant context chunks for RAG."""
    if not settings.GEMINI_API_KEY:
        return []

    query_embedding = await get_embedding_query(query)
    q = db.query(KnowledgeEmbedding)
    if animal_id:
        q = q.filter(KnowledgeEmbedding.animal_id == animal_id)

    # pgvector cosine similarity search
    results = (
        q.order_by(KnowledgeEmbedding.embedding.cosine_distance(query_embedding))
        .limit(limit)
        .all()
    )
    return [r.content for r in results]


async def get_embedding_query(text: str) -> list[float]:
    """Embedding for query (different task_type than document)."""
    if not settings.GEMINI_API_KEY:
        return [0.0] * settings.EMBED_DIMENSIONS
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    result = genai.embed_content(
        model=settings.GEMINI_EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]
