"""Raw file storage for uploaded documents.

Stores files to a local volume (/data/raw/) organized by project_id.
In production, this could be swapped for S3-compatible storage.
"""
import os
import shutil
from pathlib import Path

from app.core.config import settings


def get_project_dir(project_id: str) -> Path:
    """Get the storage directory for a project, creating it if needed."""
    project_dir = Path(settings.storage_dir) / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    return project_dir


def store_file(project_id: str, filename: str, content: bytes) -> str:
    """Store a file and return its storage path."""
    project_dir = get_project_dir(project_id)
    file_path = project_dir / filename
    file_path.write_bytes(content)
    return str(file_path)


def list_stored_files(project_id: str) -> list[str]:
    """List all stored files for a project."""
    project_dir = get_project_dir(project_id)
    if not project_dir.exists():
        return []
    return [str(f) for f in project_dir.iterdir() if f.is_file()]


def delete_project_files(project_id: str):
    """Delete all stored files for a project."""
    project_dir = get_project_dir(project_id)
    if project_dir.exists():
        shutil.rmtree(project_dir)
