"""
Supervisor Agent — routes readings to fast path or full pipeline.
Fast path (critical vitals): direct to alert, skip all analysis.
Full pipeline: run all 6 analysis/prediction/recommendation agents.
"""
import time
from app.agents.state import AgriGuardState
from app.ml.health_scorer import SPECIES_NORMAL_RANGES


def supervisor_node(state: AgriGuardState) -> AgriGuardState:
    start = time.monotonic()
    raw = state["raw_reading"]
    animal_type = state.get("animal_type", "cow")
    ranges = SPECIES_NORMAL_RANGES.get(animal_type, SPECIES_NORMAL_RANGES["cow"])

    temp = raw.get("temperature", 0) or 0
    hr   = raw.get("heart_rate", 0) or 0

    # Immediately dangerous: trigger fast alert bypass
    is_critical = (
        temp > ranges["temp"][1] + 1.5 or  # severe fever
        hr > ranges["hr"][1] * 1.3 or       # severe tachycardia
        (hr > 0 and hr < ranges["hr"][0] * 0.6)  # severe bradycardia
    )

    decision = "fast_alert" if is_critical else "full_pipeline"
    reason = (
        f"Temperature={temp}°C, HR={hr}bpm — "
        f"{'CRITICAL: fast-path to alert' if is_critical else 'Normal severity: full pipeline'}"
    )

    ms = int((time.monotonic() - start) * 1000)
    return {
        **state,
        "supervisor_decision": decision,
        "agent_logs": [{
            "agent": "supervisor",
            "decision": decision,
            "reasoning": reason,
            "execution_ms": ms,
        }],
    }


def route_from_supervisor(state: AgriGuardState) -> str:
    return state["supervisor_decision"]
