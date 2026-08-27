"""Embedding Worker — Redis Streams consumer.

Consumes ingestion jobs from the `shiprag:ingest_jobs` stream,
processes files (chunk → embed → store in pgvector), and updates
job status in Redis.
"""
import asyncio
import json
import logging
import signal
from pathlib import Path

import redis.asyncio as aioredis

from app.core.config import settings
from app.core.chunking import read_file, chunk_text
from app.core.embeddings import embed_texts
from app.core.vectorstore import delete_source, upsert_chunks, get_chunk_count, close_pool

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("embedding-worker")

STREAM_KEY = "shiprag:ingest_jobs"
STATUS_PREFIX = "shiprag:job_status:"

_shutdown = False


def _handle_signal(sig, frame):
    global _shutdown
    logger.info(f"Received signal {sig}, shutting down gracefully...")
    _shutdown = True


async def process_job(redis: aioredis.Redis, job_data: dict):
    """Process a single ingestion job."""
    job_id = job_data["job_id"]
    project_id = job_data["project_id"]
    user_id = job_data["user_id"]
    files = json.loads(job_data["files"])
    status_key = f"{STATUS_PREFIX}{job_id}"

    logger.info(f"Processing job {job_id}: {len(files)} file(s) for project {project_id}")

    # Update status to processing
    await redis.hset(status_key, "status", "processing")

    try:
        total_chunks = 0
        files_processed = []

        for file_path in files:
            path = Path(file_path)

            if not path.exists():
                logger.warning(f"File not found, skipping: {file_path}")
                continue

            try:
                # Read file
                text = read_file(path)
                if not text.strip():
                    logger.warning(f"Empty file, skipping: {file_path}")
                    continue

                source = str(path)

                # Delete existing chunks for this source (handles re-ingestion)
                await delete_source(project_id, source)

                # Chunk
                chunks = chunk_text(text, source=source)
                logger.info(f"  {path.name}: {len(chunks)} chunks")

                # Embed (batched)
                embeddings = embed_texts([c["text"] for c in chunks])

                # Store in pgvector
                await upsert_chunks(project_id, user_id, chunks, embeddings)

                total_chunks += len(chunks)
                files_processed.append(source)

            except Exception as e:
                logger.error(f"Error processing {file_path}: {e}")
                continue

        # Update status to done
        await redis.hset(status_key, mapping={
            "status": "done",
            "files_processed": json.dumps(files_processed),
            "total_chunks": str(total_chunks),
        })

        logger.info(
            f"Job {job_id} complete: {len(files_processed)} file(s), "
            f"{total_chunks} chunks"
        )

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        await redis.hset(status_key, mapping={
            "status": "failed",
            "error": str(e),
        })


async def run_worker():
    """Main worker loop: consume from Redis Streams."""
    redis = aioredis.from_url(settings.redis_url, decode_responses=True)

    # Create consumer group (idempotent)
    try:
        await redis.xgroup_create(
            STREAM_KEY,
            settings.consumer_group,
            id="0",
            mkstream=True,
        )
        logger.info(f"Created consumer group '{settings.consumer_group}'")
    except aioredis.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise
        logger.info(f"Consumer group '{settings.consumer_group}' already exists")

    logger.info(
        f"Worker '{settings.consumer_name}' started, "
        f"consuming from '{STREAM_KEY}' in group '{settings.consumer_group}'"
    )

    while not _shutdown:
        try:
            # Block-read from stream (5 second timeout for graceful shutdown checks)
            messages = await redis.xreadgroup(
                groupname=settings.consumer_group,
                consumername=settings.consumer_name,
                streams={STREAM_KEY: ">"},
                count=1,
                block=5000,
            )

            if not messages:
                continue

            for stream, stream_messages in messages:
                for msg_id, msg_data in stream_messages:
                    await process_job(redis, msg_data)
                    # Acknowledge message
                    await redis.xack(STREAM_KEY, settings.consumer_group, msg_id)

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(1)

    # Cleanup
    await redis.close()
    await close_pool()
    logger.info("Worker shut down")


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)
    asyncio.run(run_worker())
