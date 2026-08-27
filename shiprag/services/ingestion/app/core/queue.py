"""Redis Streams producer for ingestion jobs.

Publishes jobs to the `shiprag:ingest_jobs` stream. The Embedding Worker
consumes from this stream via a consumer group.
"""
import json
import uuid
from datetime import datetime, timezone

import redis.asyncio as aioredis

from app.core.config import settings

_redis: aioredis.Redis | None = None

STREAM_KEY = "shiprag:ingest_jobs"
STATUS_PREFIX = "shiprag:job_status:"


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


async def publish_ingest_job(
    project_id: str,
    user_id: str,
    files: list[str],
) -> str:
    """Publish an ingestion job to Redis Streams.

    Returns a unique job_id that can be used to poll status.
    """
    r = await get_redis()
    job_id = str(uuid.uuid4())

    # Set initial job status
    status_key = f"{STATUS_PREFIX}{job_id}"
    await r.hset(status_key, mapping={
        "job_id": job_id,
        "project_id": project_id,
        "user_id": user_id,
        "status": "queued",
        "files_count": str(len(files)),
        "files_processed": "[]",
        "total_chunks": "0",
        "error": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Expire status after 24 hours
    await r.expire(status_key, 86400)

    # Publish to stream
    await r.xadd(STREAM_KEY, {
        "job_id": job_id,
        "project_id": project_id,
        "user_id": user_id,
        "files": json.dumps(files),
    })

    return job_id


async def get_job_status(job_id: str) -> dict | None:
    """Get the current status of an ingestion job."""
    r = await get_redis()
    status_key = f"{STATUS_PREFIX}{job_id}"
    data = await r.hgetall(status_key)
    if not data:
        return None

    data["files_processed"] = json.loads(data.get("files_processed", "[]"))
    data["total_chunks"] = int(data.get("total_chunks", 0))
    data["files_count"] = int(data.get("files_count", 0))
    return data
