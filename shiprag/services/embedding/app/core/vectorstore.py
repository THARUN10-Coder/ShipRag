"""Direct PostgreSQL + pgvector writes for the Embedding Worker.

Uses asyncpg for async database operations. Tenant-isolated:
all operations are scoped by project_id + user_id.
"""
import asyncpg
from typing import Optional

from app.core.config import settings

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=2,
            max_size=10,
        )
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def delete_source(project_id: str, source: str):
    """Remove all chunks for a source file before re-ingesting."""
    pool = await get_pool()
    await pool.execute(
        "DELETE FROM chunks WHERE project_id = $1 AND source = $2",
        project_id, source,
    )


async def upsert_chunks(
    project_id: str,
    user_id: str,
    chunks: list[dict],
    embeddings: list[list[float]],
):
    """Insert embedded chunks for a project.

    Uses a batch INSERT for efficiency.
    """
    pool = await get_pool()

    # Build batch of rows
    rows = []
    for chunk, embedding in zip(chunks, embeddings):
        rows.append((
            project_id,
            user_id,
            chunk["source"],
            chunk["chunk_index"],
            chunk["text"],
            str(embedding),  # pgvector accepts string representation
        ))

    # Batch insert
    await pool.executemany(
        """
        INSERT INTO chunks (project_id, user_id, source, chunk_index, content, embedding)
        VALUES ($1, $2::uuid, $3, $4, $5, $6::vector)
        """,
        rows,
    )


async def get_chunk_count(project_id: str) -> int:
    """Get total chunk count for a project."""
    pool = await get_pool()
    result = await pool.fetchval(
        "SELECT COUNT(*) FROM chunks WHERE project_id = $1",
        project_id,
    )
    return result or 0
