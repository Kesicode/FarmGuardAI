"""
Agent 6: Alert & Notification — creates DB alerts and pushes via WebSocket + email.
Runs in parallel with recommendation_node after disease_predict_node.
"""
import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.agents.state import AgriGuardState
from app.models.alert import Alert
from app.core.redis_client import publish, CH_ALERTS, CH_AGENTS

SEVERITY_MAP = {
    "low": "info",
    "medium": "warning",
    "high": "warning",
    "critical": "critical",
}


def make_alert_notify_node(db: Session, owner_id: int):
    async def alert_notify_node(state: AgriGuardState) -> AgriGuardState:
        start = time.monotonic()
        risk = state.get("risk_level", "low")
        health_score = state.get("health_score", 100.0)
        obs = state.get("clean_observation", {})
        alerts_fired = []
        channels_used = []

        # Only create alerts if genuinely concerning
        if risk in ("medium", "high", "critical") or state.get("anomaly_detected"):
            severity = SEVERITY_MAP.get(risk, "info")

            # Build alert from top prediction or health factors
            top_pred = (state.get("predictions") or [{}])[0]
            pred_type = top_pred.get("type", "health_anomaly")
            message = (
                f"{state['animal_name']}: {pred_type.replace('_', ' ').title()} detected. "
                f"Health score: {health_score:.0f}/100. Risk: {risk}."
            )

            alert = Alert(
                animal_id=state["animal_id"],
                alert_type=pred_type,
                severity=severity,
                message=message,
                metric_value=health_score,
                created_at=datetime.now(timezone.utc),
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)

            alert_data = {
                "id": alert.id,
                "animal_id": state["animal_id"],
                "animal_name": state["animal_name"],
                "alert_type": pred_type,
                "severity": severity,
                "message": message,
                "health_score": health_score,
            }
            alerts_fired.append(alert_data)

            # Push via Redis → WebSocket
            await publish(CH_ALERTS.format(user_id=owner_id), {
                "type": "alert", "data": alert_data
            })
            channels_used.append("websocket")

            # Broadcast to agent monitor channel
            await publish(CH_AGENTS, {
                "type": "agent_event",
                "agent": "alert_notify",
                "animal_id": state["animal_id"],
                "animal_name": state["animal_name"],
                "severity": severity,
                "message": message,
            })

            # Email notification (async, non-blocking)
            if severity in ("warning", "critical"):
                try:
                    from app.services.notification import send_alert_email
                    await send_alert_email(owner_id=owner_id, alert=alert_data, db=db)
                    channels_used.append("email")
                except Exception:
                    pass  # Email failure should not block agent pipeline

        ms = int((time.monotonic() - start) * 1000)
        return {
            **state,
            "alerts_to_fire": alerts_fired,
            "notifications_sent": channels_used,
            "agent_logs": [{
                "agent": "alert_notify",
                "reasoning": f"Risk={risk}, alerts_created={len(alerts_fired)}, channels={channels_used}",
                "output_summary": f"{len(alerts_fired)} alerts fired",
                "execution_ms": ms,
            }],
        }
    return alert_notify_node
