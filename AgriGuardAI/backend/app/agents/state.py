"""AgriGuard LangGraph State definition."""
from typing import TypedDict, Annotated
import operator


class AgriGuardState(TypedDict):
    # ── Input ────────────────────────────────────────────────────────────
    animal_id: int
    reading_id: int
    animal_type: str
    animal_name: str
    raw_reading: dict          # raw sensor values from device/simulator

    # ── Supervisor ───────────────────────────────────────────────────────
    supervisor_decision: str   # "fast_alert" | "full_pipeline"

    # ── Agent 1: Sensor Intelligence ─────────────────────────────────────
    clean_observation: dict    # validated, cleaned sensor values
    anomaly_detected: bool
    z_scores: dict
    anomaly_source: str        # "zscore" | "range_fallback"

    # ── Agent 2: Behavioral Analysis ─────────────────────────────────────
    behavioral_score: float    # 0-100
    behavior_summary: str

    # ── Agent 3: Health Assessment ────────────────────────────────────────
    health_score: float        # 0-100 (explicit formula, no LLM)
    risk_level: str            # low | medium | high | critical
    health_factors: list[str]  # human-readable explanation

    # ── Agent 4: Disease Prediction (Gemini, only if risk > low) ─────────
    predictions: list[dict]    # [{type, confidence, reasoning}]

    # ── Agent 5: Recommendations (Gemini, only if risk > low) ───────────
    recommendations: list[dict]  # [{text, priority, action_type}]

    # ── Agent 6: Alert & Notify ───────────────────────────────────────────
    alerts_to_fire: list[dict]
    notifications_sent: list[str]

    # ── Execution tracking (accumulates across all agents) ───────────────
    agent_logs: Annotated[list[dict], operator.add]
    error: str | None
