"""
Z-score anomaly detection with cold start fallback.
Cold start: fewer than 10 readings → species-level reference ranges.
Normal: rolling 48h Z-score per metric (flag if |Z| > 2.5).
"""
import statistics
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.health_reading import HealthReading
from app.ml.health_scorer import SPECIES_NORMAL_RANGES

MIN_READINGS_FOR_ZSCORE = 10
Z_THRESHOLD = 2.5
WINDOW_HOURS = 48


def compute_anomaly(
    db: Session,
    animal_id: int,
    animal_type: str,
    reading: dict,
) -> tuple[bool, dict, str]:
    """
    Returns: (is_anomaly, detail_dict, source)
    source: "zscore" | "range_fallback"
    """
    since = datetime.now(timezone.utc) - timedelta(hours=WINDOW_HOURS)
    history = (
        db.query(HealthReading)
        .filter(
            HealthReading.animal_id == animal_id,
            HealthReading.recorded_at >= since,
        )
        .order_by(HealthReading.recorded_at.desc())
        .limit(100)
        .all()
    )

    if len(history) < MIN_READINGS_FOR_ZSCORE:
        anomaly, flags = _range_based_anomaly(reading, animal_type)
        return anomaly, flags, "range_fallback"

    return _zscore_anomaly(reading, history), {}, "zscore"


def _zscore_anomaly(reading: dict, history: list[HealthReading]) -> tuple[bool, dict]:
    z_scores: dict[str, float] = {}
    anomaly = False

    temps = [r.temperature for r in history if r.temperature is not None]
    hrs   = [r.heart_rate  for r in history if r.heart_rate  is not None]

    def z(values: list[float], val: float | None) -> float | None:
        if not values or val is None or len(values) < 2:
            return None
        μ = statistics.mean(values)
        σ = statistics.stdev(values) or 0.01
        return abs((val - μ) / σ)

    if (zv := z(temps, reading.get("temperature"))) is not None:
        z_scores["temperature"] = round(zv, 2)
        if zv > Z_THRESHOLD:
            anomaly = True

    if (zv := z(hrs, reading.get("heart_rate"))) is not None:
        z_scores["heart_rate"] = round(zv, 2)
        if zv > Z_THRESHOLD:
            anomaly = True

    return anomaly, z_scores


def _range_based_anomaly(reading: dict, animal_type: str) -> tuple[bool, dict]:
    """Cold start fallback — uses species reference ranges."""
    ranges = SPECIES_NORMAL_RANGES.get(animal_type, SPECIES_NORMAL_RANGES["cow"])
    anomaly = False
    flags: dict[str, str] = {}

    temp = reading.get("temperature")
    if temp is not None and not (ranges["temp"][0] <= temp <= ranges["temp"][1]):
        anomaly = True
        flags["temperature"] = "out_of_species_range"

    hr = reading.get("heart_rate")
    if hr is not None and not (ranges["hr"][0] <= hr <= ranges["hr"][1]):
        anomaly = True
        flags["heart_rate"] = "out_of_species_range"

    return anomaly, flags
