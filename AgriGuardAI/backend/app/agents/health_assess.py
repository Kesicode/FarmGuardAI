"""Agent 3: Health Assessment — deterministic formula, no LLM."""
import time
from app.agents.state import AgriGuardState
from app.ml.health_scorer import calculate_health_score, get_risk_level, get_health_factors


def health_assess_node(state: AgriGuardState) -> AgriGuardState:
    start = time.monotonic()
    obs = state["clean_observation"]
    animal_type = state.get("animal_type", "cow")

    health_score = calculate_health_score(obs, animal_type)
    risk_level = get_risk_level(health_score)
    factors = get_health_factors(obs, animal_type, health_score)

    ms = int((time.monotonic() - start) * 1000)
    return {
        **state,
        "health_score": round(health_score, 1),
        "risk_level": risk_level,
        "health_factors": factors,
        "agent_logs": [{
            "agent": "health_assess",
            "reasoning": f"Score={health_score:.1f} → risk={risk_level}. Factors: {'; '.join(factors)}",
            "output_summary": f"health_score={health_score:.1f}, risk={risk_level}",
            "execution_ms": ms,
        }],
    }


def route_after_health_assess(state: AgriGuardState) -> str:
    """Low-risk animals skip LLM agents — saves ~90% of Gemini API calls."""
    return "low_risk" if state["risk_level"] == "low" else "needs_llm"
