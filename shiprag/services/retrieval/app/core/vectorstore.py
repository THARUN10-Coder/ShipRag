"""Vector store retrieval queries (hybrid + vector search)."""
import asyncpg
from typing import Optional
from openai import OpenAI

from app.core.config import settings

_pool: Optional[asyncpg.Pool] = None
_openai_client = OpenAI(api_key=settings.openai_api_key)


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


def embed_query(question: str) -> list[float]:
    response = _openai_client.embeddings.create(
        model=settings.embedding_model,
        input=[question],
    )
    return response.data[0].embedding


async def search_chunks(
    project_id: str,
    question: str,
    top_k: int,
    use_hybrid: bool = True,
) -> list[dict]:
    query_emb = embed_query(question)
    pool = await get_pool()

    if use_hybrid:
        rows = await pool.fetch(
            "SELECT id, source, content, similarity, rank_score FROM match_chunks_hybrid($1::vector, $2, $3, $4)",
            str(query_emb),
            question,
            project_id,
            top_k,
        )
    else:
        rows = await pool.fetch(
            "SELECT id, source, content, similarity FROM match_chunks($1::vector, $2, $3)",
            str(query_emb),
            project_id,
            top_k,
        )

    return [dict(r) for r in rows]
