from sqlalchemy import String, ForeignKey, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from pgvector.sqlalchemy import Vector
from app.core.database import Base
from app.core.config import settings


class KnowledgeEmbedding(Base):
    """
    RAG vector store. Only populated with agent-generated summaries
    (not raw sensor readings). See rag_service.should_embed().
    """
    __tablename__ = "knowledge_embeddings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(settings.EMBED_DIMENSIONS))

    # Source metadata
    source_type: Mapped[str] = mapped_column(String(50))  # health_event|alert|recommendation|animal_profile
    source_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    animal_id: Mapped[int | None] = mapped_column(ForeignKey("animals.id"), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
