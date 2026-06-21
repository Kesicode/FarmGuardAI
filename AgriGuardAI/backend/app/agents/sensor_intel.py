"""Agent 1: Sensor Intelligence — validates, cleans, detects anomalies."""
import time
from sqlalchemy.orm import Session
from app.agents.state import AgriGuardState
from app.ml.anomaly import compute_anomaly


def make_sensor_intel_node(db: Session):
    def sensor_intel_node(state: AgriGuardState) -> AgriGuardState:
        start = time.monotonic()
        raw = state["raw_reading"]

        # Clean and validate readings
        def safe_float(v, lo=None, hi=None) -> float | None:
            try:
                f = float(v)
                if lo is not None and f < lo: return None
                if hi is not None and f > hi: return None
                return round(f, 2)
            except (TypeError, ValueError):
                return None

        clean = {
            "temperature":              safe_float(raw.get("temperature"), 20.0, 50.0),
            "heart_rate":               safe_float(raw.get("heart_rate"), 10.0, 600.0),
            "spo2":                     safe_float(raw.get("spo2"), 50.0, 100.0),
            "activity_level":           safe_float(raw.get("activity_level"), 0.0, 100.0),
            "activity_classification":  raw.get("activity_classification", "Resting"),
            "health_alert_class":       raw.get("health_alert_class", "Normal"),
            "lat":                      safe_float(raw.get("lat"), -90.0, 90.0),
            "lng":                      safe_float(raw.get("lng"), -180.0, 180.0),
        }

        missing = [k for k, v in clean.items() if v is None and k not in ("spo2", "lat", "lng", "altitude")]

        # Anomaly detection
        anomaly, z_scores, anomaly_source = compute_anomaly(
            db, state["animal_id"], state["animal_type"], clean
        )

        ms = int((time.monotonic() - start) * 1000)
        summary = (
            f"Cleaned {len([v for v in clean.values() if v is not None])}/8 fields. "
            f"Anomaly={'YES' if anomaly else 'no'} (method={anomaly_source}). "
            f"Missing: {missing or 'none'}."
        )

        return {
            **state,
            "clean_observation": clean,
            "anomaly_detected": anomaly,
            "z_scores": z_scores,
            "anomaly_source": anomaly_source,
            "agent_logs": [{
                "agent": "sensor_intel",
                "reasoning": summary,
                "execution_ms": ms,
                "output_summary": f"anomaly={anomaly}, source={anomaly_source}",
            }],
        }
    return sensor_intel_node
