from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"

    id: Mapped[int] = mapped_column(primary_key=True)
    animal_type: Mapped[str] = mapped_column(String(30), unique=True, index=True)

    # Temperature (°C)
    temp_min: Mapped[float] = mapped_column(Float)
    temp_max: Mapped[float] = mapped_column(Float)

    # Heart rate (bpm)
    hr_min: Mapped[float] = mapped_column(Float)
    hr_max: Mapped[float] = mapped_column(Float)

    # SpO2 — stored for reference, excluded from health score
    spo2_min: Mapped[float] = mapped_column(Float, default=90.0)

    # Activity (0-100)
    activity_min: Mapped[float] = mapped_column(Float, default=5.0)
