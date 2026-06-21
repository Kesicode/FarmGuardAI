from sqlalchemy import String, Float, ForeignKey, Text, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.core.database import Base


class Animal(Base):
    __tablename__ = "animals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    animal_type: Mapped[str] = mapped_column(String(30))  # cow|chicken|goat|pig|dog
    breed: Mapped[str | None] = mapped_column(String(100), nullable=True)
    age_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)
    tag_number: Mapped[str | None] = mapped_column(String(50), nullable=True, unique=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    qr_code: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)

    # Geofencing
    geofence_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    geofence_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    geofence_radius_m: Mapped[float | None] = mapped_column(Float, default=500.0, nullable=True)

    # AI-computed health state
    health_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), default="unknown")
    last_health_update: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    owner: Mapped["User"] = relationship("User", back_populates="animals")
    device: Mapped["Device | None"] = relationship("Device", back_populates="animal", uselist=False)
    health_readings: Mapped[list["HealthReading"]] = relationship("HealthReading", back_populates="animal", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="animal", cascade="all, delete-orphan")
    predictions: Mapped[list["Prediction"]] = relationship("Prediction", back_populates="animal", cascade="all, delete-orphan")
    recommendations: Mapped[list["Recommendation"]] = relationship("Recommendation", back_populates="animal", cascade="all, delete-orphan")
    locations: Mapped[list["Location"]] = relationship("Location", back_populates="animal", cascade="all, delete-orphan")
    agent_logs: Mapped[list["AgentLog"]] = relationship("AgentLog", back_populates="animal", cascade="all, delete-orphan")
