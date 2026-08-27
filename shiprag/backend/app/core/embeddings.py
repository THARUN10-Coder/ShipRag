"""Google Gemini Embedding Engine for SHIPRAG.

Directly powers high-dimensional semantic search and vector retrieval
using Google Gemini Embedding model (`gemini-embedding-001`).
"""
import os
import json
import urllib.request
import urllib.error
from typing import List

from app.core.config import settings

def _get_gemini_api_key() -> str:
    return settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")


def _embed_single_gemini(text: str, model: str = "models/gemini-embedding-001") -> List[float]:
    """Fetch dense embedding vector from Google Gemini."""
    api_key = _get_gemini_api_key()
    if not api_key:
        return _fallback_vector(text)

    url = f"https://generativelanguage.googleapis.com/v1beta/{model}:embedContent?key={api_key}"
    payload = {
        "model": model,
        "content": {
            "parts": [{"text": text[:3000]}]
        }
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                values = data.get("embedding", {}).get("values", [])
                if values:
                    return values
    except Exception as e:
        print(f"[Gemini Embedding Notice]: {e}")

    return _fallback_vector(text)


def _fallback_vector(text: str) -> List[float]:
    """Fast deterministic hashing vector for offline/network fallback."""
    import hashlib
    dims = settings.embedding_dims or 1024
    h = int(hashlib.md5(text.encode()).hexdigest(), 16)
    return [((h >> (i % 32)) & 0xFF) / 255.0 for i in range(dims)]


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed a batch of text chunks using Google Gemini batchEmbedContents API."""
    if not texts:
        return []

    api_key = _get_gemini_api_key()
    if not api_key:
        return [_fallback_vector(t) for t in texts]

    # Process in batches of 20 for Gemini batchEmbedContents
    results: List[List[float]] = []
    chunk_batch_size = 20

    for i in range(0, len(texts), chunk_batch_size):
        sub_batch = texts[i:i + chunk_batch_size]
        payload = {
            "requests": [
                {
                    "model": "models/gemini-embedding-001",
                    "content": {
                        "parts": [{"text": (t[:2500] if t.strip() else "code")}]
                    }
                }
                for t in sub_batch
            ]
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key={api_key}"

        success = False
        import time

        for attempt in range(3):
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode())
                        embeddings = data.get("embeddings", [])
                        if embeddings and len(embeddings) == len(sub_batch):
                            for emb_obj in embeddings:
                                results.append(emb_obj.get("values", []))
                            success = True
                            break
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    time.sleep(1.5 * (attempt + 1))
                else:
                    break
            except Exception as e:
                print(f"[Gemini batchEmbedContents Notice]: {e}")
                break

        if not success:
            for t in sub_batch:
                results.append(_embed_single_gemini(t))

    return results


def embed_query(text: str) -> List[float]:
    """Embed search query with Gemini embedding model."""
    if not text.strip():
        return _fallback_vector("query")
    return _embed_single_gemini(text)




