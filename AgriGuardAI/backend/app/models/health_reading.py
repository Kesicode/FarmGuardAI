from sqlalchemy import Float, ForeignKey, DateTime, String, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.core.database import Base


class HealthReading(Base):
    __tablename__ = "health_readings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animals.id"), index=True)
    device_id: Mapped[int | None] = mapped_column(ForeignKey("devices.id"), nullable=True)

    # Sensor data from ESP32
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)       # °C (MLX90614)
    heart_rate: Mapped[float | None] = mapped_column(Float, nullable=True)         # bpm (MAX30102)
    spo2: Mapped[float | None] = mapped_column(Float, nullable=True)               # % — stored but excluded from health score (unvalidated for animals)
    activity_level: Mapped[float | None] = mapped_column(Float, nullable=True)     # 0-100 (MPU6050)

    # TinyML on-device classifications
    activity_classification: Mapped[str | None] = mapped_column(String(30), nullable=True)  # Resting|Walking|Rumination|RandomActivity
    health_alert_class: Mapped[str | None] = mapped_column(String(30), nullable=True)        # Normal|DigestiveIssue|InfectionRisk|Stress|HeatStress

    # GPS (Neo-6M)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    altitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Source
    source: Mapped[str] = mapped_column(String(20), default="device")  # device|manual|simulator

    # Agent-computed outputs (populated after agent graph runs)
    behavioral_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    health_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    anomaly_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    agent_processed: Mapped[bool] = mapped_column(Boolean, default=False)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    animal: Mapped["Animal"] = relationship("Animal", back_populates="health_readings")
    device: Mapped["Device | None"] = relationship("Device", back_populates="health_readings")
