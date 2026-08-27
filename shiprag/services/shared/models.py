"""Shared Pydantic models used across multiple services."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Auth models ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    display_name: str = ""


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    display_name: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class APIKeyCreate(BaseModel):
    project_id: str
    label: str = "default"


class APIKeyResponse(BaseModel):
    key_id: str
    key_prefix: str
    project_id: str
    label: str
    created_at: datetime
    # raw_key is only returned once, at creation time
    raw_key: Optional[str] = None


# ── Project models ───────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    docs_dir: str = "./docs"


class ProjectResponse(BaseModel):
    project_id: str
    name: str
    description: str
    chunk_count: int
    last_synced_at: Optional[datetime] = None
    created_at: datetime


# ── Ingestion models ────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    project_id: str
    paths: list[str]


class IngestJobResponse(BaseModel):
    job_id: str
    project_id: str
    status: str  # queued | processing | done | failed
    files_count: int


class IngestStatusResponse(BaseModel):
    job_id: str
    status: str
    files_processed: list[str] = []
    total_chunks: int = 0
    error: Optional[str] = None


# ── Query models ─────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    project_id: str
    question: str
    top_k: int = 5
    use_hybrid: bool = True


class SourceChunk(BaseModel):
    source: str
    content: str
    similarity: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    cached: bool = False
