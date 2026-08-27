"""Embedding Worker — FastAPI health + status endpoints.

The actual work happens in worker.py (Redis Streams consumer).
This provides health checks and worker status for observability.
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


# Start the worker loop as a background task
_worker_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _worker_task
    from app.worker import run_worker
    _worker_task = asyncio.create_task(run_worker())
    yield
    if _worker_task:
        _worker_task.cancel()
        try:
            await _worker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="SHIPRAG Embedding Worker",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "service": "embedding-worker",
        "status": "ok",
        "consumer_group": settings.consumer_group,
        "consumer_name": settings.consumer_name,
    }
