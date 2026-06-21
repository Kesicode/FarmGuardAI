"""APScheduler — ONLY for offline animal detection. NOT for reading ingestion."""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta, timezone

scheduler = AsyncIOScheduler()


def start_scheduler():
    scheduler.add_job(
        check_offline_devices,
        "interval",
        minutes=5,
        id="offline_device_check",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown(wait=False)


async def check_offline_devices():
    """Mark devices offline and create missing_animal alerts if last_seen > 15min."""
    from app.core.database import SessionLocal
    from app.models.device import Device
    from app.models.alert import Alert
    from app.core.redis_client import publish, CH_ALERTS

    db = SessionLocal()
    try:
        threshold = datetime.now(timezone.utc) - timedelta(minutes=15)
        stale_devices = (
            db.query(Device)
            .filter(
                Device.last_seen < threshold,
                Device.animal_id.isnot(None),
                Device.status != "offline",
            )
            .all()
        )
        for device in stale_devices:
            device.status = "offline"
            # Check if a recent unresolved alert already exists
            existing = db.query(Alert).filter(
                Alert.animal_id == device.animal_id,
                Alert.alert_type == "device_offline",
                Alert.is_resolved == False,
            ).first()
            if not existing:
                alert = Alert(
                    animal_id=device.animal_id,
                    alert_type="device_offline",
                    severity="warning",
                    message=f"Device {device.device_serial} has not reported in >15 minutes.",
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)
                # Notify owner
                if device.animal and device.animal.owner_id:
                    await publish(CH_ALERTS.format(user_id=device.animal.owner_id), {
                        "type": "alert",
                        "data": {
                            "alert_type": "device_offline",
                            "severity": "warning",
                            "message": alert.message,
                        },
                    })
        db.commit()
    finally:
        db.close()
