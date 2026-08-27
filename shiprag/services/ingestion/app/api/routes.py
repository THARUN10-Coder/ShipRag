"""Ingestion Service API routes.

Accepts file uploads or path lists, stores raw files, and publishes
async ingestion jobs to Redis Streams. Returns immediately with a job_id.
"""
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional

from app.core.queue import publish_ingest_job, get_job_status
from app.core.storage import store_file, list_stored_files

router = APIRouter(prefix="/api", tags=["ingest"])

SUPPORTED_EXTENSIONS = {".md", ".txt", ".pdf", ".docx", ".csv", ".html"}


@router.post("/ingest")
async def ingest(
    project_id: str = Form(...),
    user_id: str = Form(default="anonymous"),
    files: list[UploadFile] = File(default=[]),
    paths: Optional[str] = Form(default=None),
):
    """Ingest documents for a project.

    Accepts either:
    - File uploads (multipart form)
    - A JSON list of file paths already on disk (for CLI / webhook use)

    Returns immediately with a job_id. Poll /ingest/status/{job_id} for progress.
    """
    stored_paths: list[str] = []

    # Handle file uploads
    for f in files:
        ext = Path(f.filename or "").suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            continue
        content = await f.read()
        path = store_file(project_id, f.filename, content)
        stored_paths.append(path)

    # Handle path list (from CLI or webhook)
    if paths:
        import json
        try:
            path_list = json.loads(paths)
        except json.JSONDecodeError:
            path_list = [paths]

        for p in path_list:
            p = str(p)
            ext = Path(p).suffix.lower()
            if ext in SUPPORTED_EXTENSIONS and os.path.exists(p):
                stored_paths.append(p)

    if not stored_paths:
        raise HTTPException(
            status_code=400,
            detail=f"No supported files found. Supported: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    # Publish async job
    job_id = await publish_ingest_job(project_id, user_id, stored_paths)

    return {
        "job_id": job_id,
        "project_id": project_id,
        "status": "queued",
        "files_count": len(stored_paths),
    }


@router.post("/ingest/sync")
async def ingest_sync(
    project_id: str = Form(...),
    paths: Optional[str] = Form(default=None),
):
    """Synchronous ingest endpoint (backward-compatible with MVP CLI).

    Still publishes to queue but provides the same response format as the MVP.
    """
    import json

    path_list = []
    if paths:
        try:
            path_list = json.loads(paths)
        except json.JSONDecodeError:
            path_list = [paths]

    stored_paths = [
        p for p in path_list
        if Path(p).suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not stored_paths:
        raise HTTPException(status_code=400, detail="No supported files found")

    job_id = await publish_ingest_job(project_id, "anonymous", stored_paths)

    return {
        "job_id": job_id,
        "project_id": project_id,
        "status": "queued",
        "files_count": len(stored_paths),
    }


@router.get("/ingest/status/{job_id}")
async def ingest_status(job_id: str):
    """Poll the status of an ingestion job."""
    status = await get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": status["job_id"],
        "status": status["status"],
        "files_processed": status["files_processed"],
        "total_chunks": status["total_chunks"],
        "error": status.get("error", ""),
    }
