"""
Agent 4: Disease Prediction — Gemini-powered, only called when risk > low.
Uses structured output (JSON) from Gemini with health context.
Fallback: rule-based prediction if no API key configured.
"""
import time
import json
from app.agents.state import AgriGuardState
from app.core.config import settings


RULE_BASED_PREDICTIONS = {
    "HeatStress":     ("heat_stress",        0.85),
    "InfectionRisk":  ("infection",          0.80),
    "DigestiveIssue": ("digestive_disorder", 0.75),
    "Stress":         ("fatigue",            0.70),
}

PREDICTION_PROMPT = """You are a veterinary AI specialist analyzing livestock health data.

Animal: {animal_name} ({animal_type})
Health Score: {health_score}/100
Risk Level: {risk_level}
Current Vitals:
- Temperature: {temperature}°C
- Heart Rate: {heart_rate} bpm
- Activity: {activity_class}
- TinyML Health Class: {alert_class}
Behavioral Score: {behavioral_score}/100
Key Health Factors: {health_factors}
Anomaly Detected: {anomaly}

Based on this data, identify the most likely health condition.
Respond with valid JSON only:
{{
  "prediction_type": "digestive_disorder|heat_stress|infection|fatigue|dehydration|normal",
  "confidence": 0.0-1.0,
  "reasoning": "concise veterinary explanation (max 100 words)",
  "secondary_prediction": "optional second condition or null",
  "secondary_confidence": 0.0-1.0
}}
"""


async def disease_predict_node(state: AgriGuardState) -> AgriGuardState:
    start = time.monotonic()
    obs = state["clean_observation"]
    predictions = []
    model_used = "rule_based"

    if settings.use_gemini and settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)

            prompt = PREDICTION_PROMPT.format(
                animal_name=state["animal_name"],
                animal_type=state["animal_type"],
                health_score=state["health_score"],
                risk_level=state["risk_level"],
                temperature=obs.get("temperature", "N/A"),
                heart_rate=obs.get("heart_rate", "N/A"),
                activity_class=obs.get("activity_classification", "Unknown"),
                alert_class=obs.get("health_alert_class", "Normal"),
                behavioral_score=state.get("behavioral_score", 0),
                health_factors="; ".join(state.get("health_factors", [])),
                anomaly=state.get("anomaly_detected", False),
            )

            response = await model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json", "temperature": 0.3},
            )
            result = json.loads(response.text)
            predictions.append({
                "type": result["prediction_type"],
                "confidence": round(float(result["confidence"]), 2),
                "reasoning": result["reasoning"],
            })
            if result.get("secondary_prediction") and result.get("secondary_confidence", 0) > 0.3:
                predictions.append({
                    "type": result["secondary_prediction"],
                    "confidence": round(float(result["secondary_confidence"]), 2),
                    "reasoning": "Secondary condition detected alongside primary prediction.",
                })
            model_used = settings.GEMINI_MODEL
        except Exception as e:
            predictions = _rule_based(obs)
            model_used = f"rule_based (gemini error: {str(e)[:50]})"
    else:
        predictions = _rule_based(obs)

    ms = int((time.monotonic() - start) * 1000)
    top = predictions[0] if predictions else {"type": "unknown", "confidence": 0}

    return {
        **state,
        "predictions": predictions,
        "agent_logs": [{
            "agent": "disease_predict",
            "reasoning": f"Top prediction: {top['type']} ({top['confidence']*100:.0f}%)",
            "output_summary": str(predictions),
            "model_used": model_used,
            "execution_ms": ms,
        }],
    }


def _rule_based(obs: dict) -> list[dict]:
    alert_class = obs.get("health_alert_class", "Normal")
    if alert_class in RULE_BASED_PREDICTIONS:
        ptype, conf = RULE_BASED_PREDICTIONS[alert_class]
        return [{"type": ptype, "confidence": conf,
                 "reasoning": f"Rule-based: TinyML classified as {alert_class}."}]
    temp = obs.get("temperature", 0) or 0
    if temp > 40.0:
        return [{"type": "heat_stress", "confidence": 0.70,
                 "reasoning": f"Elevated temperature ({temp}°C) suggests heat stress."}]
    return [{"type": "fatigue", "confidence": 0.55,
             "reasoning": "Vitals outside normal range with no specific TinyML classification."}]
