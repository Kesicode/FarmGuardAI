"""
Redis pub/sub backed WebSocket manager.
All WS state is in Redis — horizontally scalable.
4 channels: health, alerts, agents, herd.
"""
import asyncio
import json
import redis.asyncio as aioredis
from fastapi import WebSocket, WebSocketDisconnect
from app.core.config import settings
from app.core.redis_client import CH_HEALTH, CH_ALERTS, CH_AGENTS, CH_HERD


class RedisWebSocketManager:
    """
    WebSocket clients subscribe to Redis pub/sub channels.
    Any backend instance can publish — all subscribed clients receive.
    """

    async def _relay(self, websocket: WebSocket, channel: str) -> None:
        """Subscribe to a Redis channel and relay messages to the WebSocket client."""
        redis_conn = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        pubsub = redis_conn.pubsub()
        await pubsub.subscribe(channel)
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        await websocket.send_text(message["data"])
                    except (WebSocketDisconnect, Exception):
                        break
        finally:
            await pubsub.unsubscribe(channel)
            await redis_conn.aclose()

    async def handle_health(self, websocket: WebSocket, animal_id: int) -> None:
        await websocket.accept()
        channel = CH_HEALTH.format(animal_id=animal_id)
        relay_task = asyncio.create_task(self._relay(websocket, channel))
        try:
            while True:
                await websocket.receive_text()  # keep-alive ping
        except (WebSocketDisconnect, Exception):
            relay_task.cancel()

    async def handle_alerts(self, websocket: WebSocket, user_id: int) -> None:
        await websocket.accept()
        channel = CH_ALERTS.format(user_id=user_id)
        relay_task = asyncio.create_task(self._relay(websocket, channel))
        try:
            while True:
                await websocket.receive_text()
        except (WebSocketDisconnect, Exception):
            relay_task.cancel()

    async def handle_agents(self, websocket: WebSocket) -> None:
        await websocket.accept()
        relay_task = asyncio.create_task(self._relay(websocket, CH_AGENTS))
        try:
            while True:
                await websocket.receive_text()
        except (WebSocketDisconnect, Exception):
            relay_task.cancel()

    async def handle_herd(self, websocket: WebSocket) -> None:
        await websocket.accept()
        relay_task = asyncio.create_task(self._relay(websocket, CH_HERD))
        try:
            while True:
                await websocket.receive_text()
        except (WebSocketDisconnect, Exception):
            relay_task.cancel()


ws_manager = RedisWebSocketManager()
