"""Auth Service database access layer.

Uses raw asyncpg queries for simplicity — no ORM overhead for a small
set of well-defined tables.
"""
import asyncpg
from typing import Optional

from app.core.config import settings

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    """Get or create the connection pool."""
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


# ── User queries ─────────────────────────────────────────────────────────────

async def create_user(email: str, password_hash: str, display_name: str) -> dict:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO users (email, password_hash, display_name)
        VALUES ($1, $2, $3)
        RETURNING id, email, display_name, created_at
        """,
        email, password_hash, display_name,
    )
    return dict(row)


async def get_user_by_email(email: str) -> Optional[dict]:
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = $1",
        email,
    )
    return dict(row) if row else None


async def get_user_by_id(user_id: str) -> Optional[dict]:
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT id, email, display_name, created_at FROM users WHERE id = $1::uuid",
        user_id,
    )
    return dict(row) if row else None


# ── API key queries ──────────────────────────────────────────────────────────

async def create_api_key(
    user_id: str, project_id: str, key_prefix: str, key_hash: str, label: str
) -> dict:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO api_keys (user_id, project_id, key_prefix, key_hash, label)
        VALUES ($1::uuid, $2, $3, $4, $5)
        RETURNING id, key_prefix, project_id, label, created_at
        """,
        user_id, project_id, key_prefix, key_hash, label,
    )
    return dict(row)


async def get_api_keys_for_user(user_id: str) -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT id, key_prefix, project_id, label, is_active, last_used_at, created_at
        FROM api_keys
        WHERE user_id = $1::uuid AND is_active = TRUE
        ORDER BY created_at DESC
        """,
        user_id,
    )
    return [dict(r) for r in rows]


async def verify_api_key_hash(key_hash: str) -> Optional[dict]:
    """Look up an API key by its hash. Returns user + project info."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT ak.id AS key_id, ak.project_id, ak.user_id,
               u.email, ak.is_active
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.key_hash = $1 AND ak.is_active = TRUE
        """,
        key_hash,
    )
    if row:
        # Update last_used_at
        await pool.execute(
            "UPDATE api_keys SET last_used_at = now() WHERE id = $1::uuid",
            row["key_id"],
        )
    return dict(row) if row else None


async def delete_api_key(key_id: str, user_id: str) -> bool:
    pool = await get_pool()
    result = await pool.execute(
        "UPDATE api_keys SET is_active = FALSE WHERE id = $1::uuid AND user_id = $2::uuid",
        key_id, user_id,
    )
    return result == "UPDATE 1"


# ── Project queries ──────────────────────────────────────────────────────────

async def create_project(
    project_id: str, user_id: str, name: str, description: str, docs_dir: str
) -> dict:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        INSERT INTO projects (project_id, user_id, name, description, docs_dir)
        VALUES ($1, $2::uuid, $3, $4, $5)
        RETURNING project_id, name, description, chunk_count, last_synced_at, created_at
        """,
        project_id, user_id, name, description, docs_dir,
    )
    return dict(row)


async def get_projects_for_user(user_id: str) -> list[dict]:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT project_id, name, description, chunk_count, last_synced_at, created_at
        FROM projects
        WHERE user_id = $1::uuid
        ORDER BY created_at DESC
        """,
        user_id,
    )
    return [dict(r) for r in rows]


async def get_project(project_id: str) -> Optional[dict]:
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT project_id, user_id, name, description, chunk_count, last_synced_at, created_at FROM projects WHERE project_id = $1",
        project_id,
    )
    return dict(row) if row else None
