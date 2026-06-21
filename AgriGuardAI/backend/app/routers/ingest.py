"""Ingest router — event-driven, 202 pattern. APScheduler NOT used here."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_device_by_serial
from app.models.device import Device
from app.models.health_reading import HealthReading
from app.agents.graph import run_agent_graph

router = APIRouter(prefix="/ingest", tags=["ingest"])


class DevicePayload(BaseModel):
    temperature: Optional[float] = Field(None, description="°C from MLX90614")
    heart_rate: Optional[float] = Field(None, description="bpm from MAX30102")
    spo2: Optional[float] = Field(None, description="% SpO2 (stored, excluded from health score)")
    activity_level: Optional[float] = Field(None, ge=0, le=100)
    activity_classification: Optional[str] = "Resting"
    health_alert_class: Optional[str] = "Normal"
    lat: Optional[float] = None
    lng: Optional[float] = None
    altitude: Optional[float] = None
    battery_pct: Optional[float] = None


class SimulatePayload(DevicePayload):
    animal_id: int
    source: str = "simulator"


@router.post("/device", status_code=202)
async def ingest_device_reading(
    body: DevicePayload,
    background_tasks: BackgroundTasks,
    device: Device = Depends(get_device_by_serial),
    db: Session = Depends(get_db),
):
    """
    ESP32 device posts sensor reading.
    Stores immediately → triggers agent graph in background → returns 202.
    """
    if not device.animal_id:
        raise HTTPException(status_code=400, detail="Device not linked to an animal")

    reading = HealthReading(
        animal_id=device.animal_id,
        device_id=device.id,
        temperature=body.temperature,
        heart_rate=body.heart_rate,
        spo2=body.spo2,
        activity_level=body.activity_level,
        activity_classification=body.activity_classification,
        health_alert_class=body.health_alert_class,
        lat=body.lat,
        lng=body.lng,
        altitude=body.altitude,
        source="device",
    )
    db.add(reading)

    device.last_seen = datetime.now(timezone.utc)
    device.status = "online"
    if body.battery_pct is not None:
        device.battery_pct = body.battery_pct
    if body.lat:
        device.lat = body.lat
        device.lng = body.lng

    db.commit()
    db.refresh(reading)

    # Fire agent graph asynchronously — does NOT block response
    background_tasks.add_task(run_agent_graph, reading.id, device.animal_id)

    return {"status": "accepted", "reading_id": reading.id, "animal_id": device.animal_id}


@router.post("/simulate", status_code=202)
async def simulate_reading(
    body: SimulatePayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Inject simulated sensor data for demo/testing without physical hardware."""
    from app.models.animal import Animal
    animal = db.get(Animal, body.animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")

    reading = HealthReading(
        animal_id=body.animal_id,
        temperature=body.temperature,
        heart_rate=body.heart_rate,
        spo2=body.spo2,
        activity_level=body.activity_level,
        activity_classification=body.activity_classification,
        health_alert_class=body.health_alert_class,
        lat=body.lat,
        lng=body.lng,
        source="simulator",
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    background_tasks.add_task(run_agent_graph, reading.id, body.animal_id)
    return {"status": "accepted", "reading_id": reading.id, "animal_id": body.animal_id}
