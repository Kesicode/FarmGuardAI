"""
Agent 5: Recommendation Generator — Gemini-powered action plans.
Generates ranked, actionable recommendations based on predictions + health state.
"""
import time
import json
from app.agents.state import AgriGuardState
from app.core.config import settings

RECOMMENDATION_PROMPT = """You are an agricultural veterinary advisor. Generate actionable recommendations for a farmer.

Animal: {animal_name} ({animal_type})
Health Score: {health_score}/100  (100=perfect, <35=critical)
Risk Level: {risk_level}
Top Prediction: {top_prediction} ({top_confidence}% confidence)
Health Factors: {health_factors}
Behavioral Summary: {behavior_summary}

Generate 2-4 specific, prioritized recommendations. Respond with JSON only:
[
  {{
    "text": "specific actionable instruction",
    "priority": "low|medium|high|urgent",
    "action_type": "monitor|isolate|medicate|vet_visit|water|feed"
  }}
]
Order from highest to lowest priority. Be specific, not generic.
"""

RULE_RECOMMENDATIONS = {
    "heat_stress": [
        {"text": "Move animal to shaded area immediately. Ensure constant access to cool, clean water.", "priority": "urgent", "action_type": "monitor"},
        {"text": "Schedule veterinary inspection within 24 hours if temperature exceeds 40.5°C.", "priority": "high", "action_type": "vet_visit"},
    ],
    "infection": [
        {"text": "Isolate animal from the herd immediately to prevent possible disease spread.", "priority": "urgent", "action_type": "isolate"},
        {"text": "Contact veterinarian for antibiotic assessment.", "priority": "high", "action_type": "vet_visit"},
    ],
    "digestive_disorder": [
        {"text": "Withhold grain feed for 12 hours. Provide fresh hay and water only.", "priority": "high", "action_type": "feed"},
        {"text": "Monitor rumination activity every 2 hours. Alert vet if rumination stops.", "priority": "medium", "action_type": "monitor"},
    ],
    "fatigue": [
        {"text": "Ensure animal has unobstructed access to water. Check for dehydration signs.", "priority": "medium", "action_type": "water"},
        {"text": "Monitor activity levels for next 4 hours.", "priority": "low", "action_type": "monitor"},
    ],
    "dehydration": [
        {"text": "Provide electrolyte solution in water immediately.", "priority": "urgent", "action_type": "water"},
        {"text": "Schedule veterinary check if animal refuses water.", "priority": "high", "action_type": "vet_visit"},
    ],
}


async def recommendation_node(state: AgriGuardState) -> AgriGuardState:
    start = time.monotonic()
    predictions = state.get("predictions", [])
    top_pred = predictions[0] if predictions else {"type": "unknown", "confidence": 0}
    recommendations = []
    model_used = "rule_based"

    if settings.use_gemini and settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)

            prompt = RECOMMENDATION_PROMPT.format(
                animal_name=state["animal_name"],
                animal_type=state["animal_type"],
                health_score=state["health_score"],
                risk_level=state["risk_level"],
                top_prediction=top_pred["type"],
                top_confidence=int(top_pred["confidence"] * 100),
                health_factors="; ".join(state.get("health_factors", [])),
                behavior_summary=state.get("behavior_summary", ""),
            )

            response = await model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json", "temperature": 0.2},
            )
            recommendations = json.loads(response.text)
            model_used = settings.GEMINI_MODEL
        except Exception as e:
            recommendations = RULE_RECOMMENDATIONS.get(top_pred["type"], _default_recs(state["risk_level"]))
            model_used = f"rule_based (error: {str(e)[:40]})"
    else:
        recommendations = RULE_RECOMMENDATIONS.get(top_pred["type"], _default_recs(state["risk_level"]))

    ms = int((time.monotonic() - start) * 1000)
    return {
        **state,
        "recommendations": recommendations,
        "agent_logs": [{
            "agent": "recommendation",
            "reasoning": f"Generated {len(recommendations)} recommendations for {top_pred['type']}",
            "output_summary": f"Top: {recommendations[0]['text'][:80]}..." if recommendations else "none",
            "model_used": model_used,
            "execution_ms": ms,
        }],
    }


def _default_recs(risk_level: str) -> list[dict]:
    if risk_level == "critical":
        return [{"text": "Contact veterinarian immediately.", "priority": "urgent", "action_type": "vet_visit"}]
    return [{"text": "Monitor animal every hour and track vital signs.", "priority": "medium", "action_type": "monitor"}]
