"""
AgriGuard LangGraph StateGraph — assembles all 7 agent nodes.

Graph topology:
  supervisor
    ├─[fast_alert]──────────────────────────────► alert_notify ──► db_write ──► END
    └─[full_pipeline]► sensor_intel ─┬─► behavioral ─────────────┐
                                      └─► health_assess ──────────┤
                                                    │              │ (fan-in)
                                          [route_after_health]     │
                                            ├─[low_risk]──────────►│
                                            └─[needs_llm]► disease_predict
                                                              ├─► recommendation ──► db_write ──► END
                                                              └─► alert_notify  ──► db_write ──► END
"""
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

from app.agents.state import AgriGuardState
from app.agents.supervisor import supervisor_node, route_from_supervisor
from app.agents.sensor_intel import make_sensor_intel_node
from app.agents.behavioral import behavioral_node
from app.agents.health_assess import health_assess_node, route_after_health_assess
from app.agents.disease_predict import disease_predict_node
from app.agents.recommendations import recommendation_node
from app.agents.alert_notify import make_alert_notify_node
from app.agents.db_write import make_db_write_node


def build_graph(db: Session, owner_id: int):
    """Build and compile the AgriGuard agent graph for a specific animal owner."""
    graph = StateGraph(AgriGuardState)

    # Create DB-injected nodes
    sensor_intel  = make_sensor_intel_node(db)
    alert_notify  = make_alert_notify_node(db, owner_id)
    db_write      = make_db_write_node(db)

    # Register nodes
    graph.add_node("supervisor",       supervisor_node)
    graph.add_node("sensor_intel",     sensor_intel)
    graph.add_node("behavioral",       behavioral_node)
    graph.add_node("health_assess",    health_assess_node)
    graph.add_node("disease_predict",  disease_predict_node)
    graph.add_node("recommendation",   recommendation_node)
    graph.add_node("alert_notify",     alert_notify)
    graph.add_node("db_write",         db_write)

    # Entry point
    graph.set_entry_point("supervisor")

    # Supervisor → conditional: fast_alert or full_pipeline
    graph.add_conditional_edges(
        "supervisor",
        route_from_supervisor,
        {
            "fast_alert":    "alert_notify",
            "full_pipeline": "sensor_intel",
        },
    )

    # Sensor intel → parallel fan-out: behavioral + health_assess
    graph.add_edge("sensor_intel", "behavioral")
    graph.add_edge("sensor_intel", "health_assess")

    # Health assess → conditional: low_risk skips LLM, needs_llm goes to Gemini
    graph.add_conditional_edges(
        "health_assess",
        route_after_health_assess,
        {
            "low_risk":  "db_write",
            "needs_llm": "disease_predict",
        },
    )

    # Disease predict → parallel fan-out: recommendation + alert_notify
    graph.add_edge("disease_predict", "recommendation")
    graph.add_edge("disease_predict", "alert_notify")

    # Converge to db_write
    graph.add_edge("recommendation", "db_write")
    graph.add_edge("alert_notify",   "db_write")
    graph.add_edge("behavioral",     "db_write")  # behavioral also writes to db
    graph.add_edge("db_write", END)

    return graph.compile()


async def run_agent_graph(reading_id: int, animal_id: int) -> AgriGuardState | None:
    """Entry point called by BackgroundTasks in ingest router."""
    from app.models.health_reading import HealthReading
    from app.models.animal import Animal

    with SessionLocal() as db:
        reading = db.get(HealthReading, reading_id)
        animal = db.get(Animal, animal_id)
        if not reading or not animal:
            return None

        initial_state: AgriGuardState = {
            "animal_id": animal_id,
            "reading_id": reading_id,
            "animal_type": animal.animal_type,
            "animal_name": animal.name,
            "raw_reading": {
                "temperature":              reading.temperature,
                "heart_rate":               reading.heart_rate,
                "spo2":                     reading.spo2,
                "activity_level":           reading.activity_level,
                "activity_classification":  reading.activity_classification,
                "health_alert_class":       reading.health_alert_class,
                "lat":                      reading.lat,
                "lng":                      reading.lng,
            },
            "supervisor_decision": "",
            "clean_observation": {},
            "anomaly_detected": False,
            "z_scores": {},
            "anomaly_source": "",
            "behavioral_score": 0.0,
            "behavior_summary": "",
            "health_score": 100.0,
            "risk_level": "low",
            "health_factors": [],
            "predictions": [],
            "recommendations": [],
            "alerts_to_fire": [],
            "notifications_sent": [],
            "agent_logs": [],
            "error": None,
        }

        graph = build_graph(db, animal.owner_id)
        try:
            result = await graph.ainvoke(initial_state)
            return result
        except Exception as e:
            return None
