from sqlalchemy import String, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animals.id"), index=True)
    alert_type: Mapped[str] = mapped_column(String(50))  # fever|hypothermia|tachycardia|bradycardia|low_spo2|inactivity|missing_animal|device_offline
    severity: Mapped[str] = mapped_column(String(20))    # info|warning|critical
    message: Mapped[str] = mapped_column(String(500))
    metric_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notification_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    notification_channels: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # {"email": true, "sms": false}
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    animal: Mapped["Animal"] = relationship("Animal", back_populates="alerts")
