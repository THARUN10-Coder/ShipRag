"""Embedding provider wrapper with batching support.

Calls OpenAI's embedding API in configurable batches to stay within
per-request limits for large document sets.
"""
from openai import OpenAI

from app.core.config import settings

_client = OpenAI(api_key=settings.openai_api_key)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings in batches.

    Returns one embedding vector per input string, preserving order.
    """
    all_embeddings = []
    batch_size = settings.embedding_batch_size

    for i in range(0, len(texts), batch_size):
        batch = texts[i: i + batch_size]
        response = _client.embeddings.create(
            model=settings.embedding_model,
            input=batch,
        )
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings


def embed_query(text: str) -> list[float]:
    """Embed a single query string."""
    return embed_texts([text])[0]
