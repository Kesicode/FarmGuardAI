from sqlalchemy import String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.core.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animals.id"), index=True)
    prediction_id: Mapped[int | None] = mapped_column(ForeignKey("predictions.id"), nullable=True)

    recommendation_text: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(20))       # low|medium|high|urgent
    action_type: Mapped[str] = mapped_column(String(50))    # monitor|isolate|medicate|vet_visit|water|feed
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|acknowledged|completed|dismissed
    generated_by: Mapped[str] = mapped_column(String(50), default="recommendation_agent")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    animal: Mapped["Animal"] = relationship("Animal", back_populates="recommendations")
