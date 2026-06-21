"""FastAPI application entry point — AgriGuard AI Agent Network."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
import app.models  # noqa: F401 — register all models

from app.routers import auth, animals, devices, health, alerts, websocket, ingest
from app.routers import predictions, recommendations, analytics, locations, chat
from app.routers.admin import users as admin_users, animals as admin_animals
from app.routers.admin import devices as admin_devices, alerts as admin_alerts
from app.routers.admin import stats as admin_stats, logs as admin_logs
from app.services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="AgriGuard AI Agent Network",
    description="Multi-agent AI livestock health monitoring platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public + farmer routes
app.include_router(auth.router)
app.include_router(animals.router)
app.include_router(devices.router)
app.include_router(health.router)
app.include_router(alerts.router)
app.include_router(ingest.router)
app.include_router(predictions.router)
app.include_router(recommendations.router)
app.include_router(analytics.router)
app.include_router(locations.router)
app.include_router(chat.router)
app.include_router(websocket.router)

# Admin routes
app.include_router(admin_users.router)
app.include_router(admin_animals.router)
app.include_router(admin_devices.router)
app.include_router(admin_alerts.router)
app.include_router(admin_stats.router)
app.include_router(admin_logs.router)


@app.get("/health-check", tags=["system"])
async def health_check():
    return {"status": "ok", "service": "AgriGuard AI Agent Network", "version": "1.0.0"}
