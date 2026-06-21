from sqlalchemy import String, Float, ForeignKey, DateTime, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_serial: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    device_type: Mapped[str] = mapped_column(String(30), default="collar")  # collar|ear_tag|ankle_band
    firmware_version: Mapped[str | None] = mapped_column(String(30), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="unassigned")  # online|offline|unassigned
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    battery_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    signal_strength: Mapped[int | None] = mapped_column(Integer, nullable=True)  # dBm
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Last known GPS from device telemetry
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)

    animal_id: Mapped[int | None] = mapped_column(ForeignKey("animals.id"), nullable=True)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    animal: Mapped["Animal | None"] = relationship("Animal", back_populates="device")
    health_readings: Mapped[list["HealthReading"]] = relationship("HealthReading", back_populates="device")
