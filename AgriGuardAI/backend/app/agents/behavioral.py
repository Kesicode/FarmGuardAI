"""Agent 2: Behavioral Analysis — activity pattern scoring."""
import time
from app.agents.state import AgriGuardState

ACTIVITY_SCORES = {
    "Rumination":     95,   # ideal — animal is healthy and digesting
    "Resting":        75,
    "Walking":        80,
    "RandomActivity": 45,   # erratic movement = concern
}

ALERT_CLASS_BEHAVIOR_IMPACT = {
    "Normal":         0,
    "Stress":        -15,
    "DigestiveIssue":-20,
    "InfectionRisk": -25,
    "HeatStress":    -30,
}


def behavioral_node(state: AgriGuardState) -> AgriGuardState:
    start = time.monotonic()
    obs = state["clean_observation"]

    activity = obs.get("activity_classification", "Resting")
    alert_class = obs.get("health_alert_class", "Normal")
    activity_level = obs.get("activity_level", 50) or 50

    # Base score from classification
    base_score = float(ACTIVITY_SCORES.get(activity, 70))

    # Adjust for TinyML health class
    base_score += ALERT_CLASS_BEHAVIOR_IMPACT.get(alert_class, 0)

    # Fine-tune with raw activity level (0-100 from accelerometer)
    if activity_level < 10 and activity not in ("Resting", "Rumination"):
        base_score -= 10  # low movement when shouldn't be resting
    elif activity_level > 85 and activity == "Resting":
        base_score -= 5   # high movement sensor but classified as resting

    behavioral_score = max(0.0, min(100.0, base_score))

    # Human-readable summary
    summaries = []
    if activity == "Rumination":
        summaries.append("Animal is ruminating — indicates healthy digestion.")
    elif activity == "RandomActivity":
        summaries.append("Erratic movement detected — possible distress or pain.")
    else:
        summaries.append(f"Activity: {activity}.")

    if alert_class != "Normal":
        summaries.append(f"TinyML flagged: {alert_class}.")

    behavior_summary = " ".join(summaries)

    ms = int((time.monotonic() - start) * 1000)
    return {
        **state,
        "behavioral_score": round(behavioral_score, 1),
        "behavior_summary": behavior_summary,
        "agent_logs": [{
            "agent": "behavioral_analysis",
            "reasoning": f"Activity={activity}, AlertClass={alert_class} → score={behavioral_score:.1f}",
            "output_summary": behavior_summary,
            "execution_ms": ms,
        }],
    }
