"""Retrieval Service entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.query import router
from app.core.vectorstore import close_pool
from app.core.cache import close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_pool()
    await close_redis()


app = FastAPI(
    title="SHIPRAG Retrieval & Generation Service",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health():
    return {"service": "retrieval", "status": "ok"}
