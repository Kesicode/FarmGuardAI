from sqlalchemy import String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animals.id"), index=True)
    reading_id: Mapped[int | None] = mapped_column(ForeignKey("health_readings.id"), nullable=True)

    # digestive_disorder|heat_stress|infection|fatigue|dehydration|normal
    prediction_type: Mapped[str] = mapped_column(String(50))
    confidence: Mapped[float] = mapped_column(Float)  # 0.0-1.0
    reasoning: Mapped[str] = mapped_column(Text)

    predicted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    animal: Mapped["Animal"] = relationship("Animal", back_populates="predictions")
