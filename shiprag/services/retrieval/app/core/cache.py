"""Redis-backed query response caching."""
import json
import hashlib
import redis.asyncio as aioredis
from typing import Optional

from app.core.config import settings

_redis: Optional[aioredis.Redis] = None
CACHE_PREFIX = "shiprag:query_cache:"


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def close_redis():
    global _redis
    if _redis:
        await _redis.close()
        _redis = None


def _make_cache_key(project_id: str, question: str, top_k: int, use_hybrid: bool) -> str:
    raw = f"{project_id}:{question.strip().lower()}:{top_k}:{use_hybrid}"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    return f"{CACHE_PREFIX}{digest}"


async def get_cached_query(project_id: str, question: str, top_k: int, use_hybrid: bool) -> Optional[dict]:
    try:
        r = await get_redis()
        key = _make_cache_key(project_id, question, top_k, use_hybrid)
        cached = await r.get(key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass
    return None


async def set_cached_query(project_id: str, question: str, top_k: int, use_hybrid: bool, data: dict):
    try:
        r = await get_redis()
        key = _make_cache_key(project_id, question, top_k, use_hybrid)
        await r.set(key, json.dumps(data), ex=settings.query_cache_ttl_seconds)
    except Exception:
        pass
