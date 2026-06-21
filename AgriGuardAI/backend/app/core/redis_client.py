"""Redis client with pub/sub channel constants."""
import json
import redis.asyncio as aioredis
from app.core.config import settings

# Channel name constants
CH_HEALTH  = "ws:health:{animal_id}"
CH_ALERTS  = "ws:alerts:{user_id}"
CH_AGENTS  = "ws:agents"
CH_HERD    = "ws:herd"


_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def publish(channel: str, data: dict) -> None:
    r = await get_redis()
    await r.publish(channel, json.dumps(data))


async def cache_set(key: str, value: str, ttl_seconds: int = 300) -> None:
    r = await get_redis()
    await r.setex(key, ttl_seconds, value)


async def cache_get(key: str) -> str | None:
    r = await get_redis()
    return await r.get(key)
