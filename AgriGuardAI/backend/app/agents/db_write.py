"""Agent 7 (DB Write) — persists all agent outputs to database."""
import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.agents.state import AgriGuardState
from app.models.health_reading import HealthReading
from app.models.prediction import Prediction
from app.models.recommendation import Recommendation
from app.models.agent_log import AgentLog
from app.models.location import Location
from app.models.animal import Animal
from app.core.redis_client import publish, CH_HEALTH, CH_HERD


def make_db_write_node(db: Session):
    async def db_write_node(state: AgriGuardState) -> AgriGuardState:
        start = time.monotonic()

        # Update health reading with agent outputs
        reading = db.get(HealthReading, state["reading_id"])
        if reading:
            reading.behavioral_score = state.get("behavioral_score")
            reading.health_score = state.get("health_score")
            reading.anomaly_detected = state.get("anomaly_detected", False)
            reading.agent_processed = True

        # Save GPS to locations table
        obs = state.get("clean_observation", {})
        if obs.get("lat") and obs.get("lng"):
            loc = Location(
                animal_id=state["animal_id"],
                lat=obs["lat"], lng=obs["lng"],
                recorded_at=datetime.now(timezone.utc),
            )
            db.add(loc)

        # Update animal health summary
        animal = db.get(Animal, state["animal_id"])
        if animal:
            animal.health_score = state.get("health_score")
            animal.risk_level = state.get("risk_level", "unknown")
            animal.last_health_update = datetime.now(timezone.utc)

        # Save predictions
        for pred in state.get("predictions", []):
            db.add(Prediction(
                animal_id=state["animal_id"],
                reading_id=state["reading_id"],
                prediction_type=pred["type"],
                confidence=pred["confidence"],
                reasoning=pred["reasoning"],
            ))

        # Save recommendations
        pred_id = None
        for rec in state.get("recommendations", []):
            db.add(Recommendation(
                animal_id=state["animal_id"],
                prediction_id=pred_id,
                recommendation_text=rec["text"],
                priority=rec["priority"],
                action_type=rec["action_type"],
            ))

        # Save all agent logs
        for log_entry in state.get("agent_logs", []):
            db.add(AgentLog(
                animal_id=state["animal_id"],
                reading_id=state["reading_id"],
                agent_name=log_entry.get("agent", "unknown"),
                input_summary=log_entry.get("input_summary"),
                output_summary=log_entry.get("output_summary"),
                reasoning=log_entry.get("reasoning"),
                execution_ms=log_entry.get("execution_ms"),
                tokens_used=log_entry.get("tokens_used"),
                model_used=log_entry.get("model_used"),
            ))

        db.commit()
        if reading: db.refresh(reading)

        # Broadcast live reading to WebSocket health channel
        await publish(CH_HEALTH.format(animal_id=state["animal_id"]), {
            "type": "health_reading",
            "animal_id": state["animal_id"],
            "animal_name": state["animal_name"],
            "reading_id": state["reading_id"],
            "temperature": obs.get("temperature"),
            "heart_rate": obs.get("heart_rate"),
            "spo2": obs.get("spo2"),
            "activity_level": obs.get("activity_level"),
            "activity_classification": obs.get("activity_classification"),
            "health_alert_class": obs.get("health_alert_class"),
            "health_score": state.get("health_score"),
            "risk_level": state.get("risk_level"),
            "behavioral_score": state.get("behavioral_score"),
            "lat": obs.get("lat"),
            "lng": obs.get("lng"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Broadcast herd summary update
        await publish(CH_HERD, {
            "type": "herd_update",
            "animal_id": state["animal_id"],
            "health_score": state.get("health_score"),
            "risk_level": state.get("risk_level"),
        })

        ms = int((time.monotonic() - start) * 1000)
        return {
            **state,
            "agent_logs": [{
                "agent": "db_write",
                "reasoning": f"Persisted reading, {len(state.get('predictions',[]))} predictions, {len(state.get('recommendations',[]))} recs, {len(state.get('agent_logs',[]))} logs",
                "execution_ms": ms,
            }],
        }
    return db_write_node
