"""Hybrid in-memory and pgvector storage engine.

Maintains an indexed in-memory cosine store for every ingested project so that
cloned GitHub repositories can be queried semantically with exact matching
even when external cloud Supabase credentials are not connected.
"""
import math
from typing import List, Dict, Any

from app.core.config import settings

import json
import os
from pathlib import Path

# Disk-backed persistent project index file
_STORAGE_FILES = [
    Path(__file__).resolve().parent.parent / "project_vector_index.json",  # backend/app/project_vector_index.json
    Path(__file__).resolve().parent.parent.parent / "project_vector_index.json", # backend/project_vector_index.json
    Path("project_vector_index.json"),
]


def _load_index() -> Dict[str, List[Dict[str, Any]]]:
    for p in _STORAGE_FILES:
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                if data:
                    return data
            except Exception:
                continue
    return {}


def _save_index(data: Dict[str, List[Dict[str, Any]]]) -> None:
    try:
        _STORAGE_FILES[0].write_text(json.dumps(data), encoding="utf-8")
    except Exception as e:
        print(f"[VectorStore Save Error]: {e}")


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)



def upsert_chunks(project_id: str, chunks: List[dict], embeddings: List[List[float]]) -> None:

    """Store embedded chunks in disk-backed index for cross-process retrieval."""
    index = _load_index()
    if project_id not in index:
        index[project_id] = []

    for c, emb in zip(chunks, embeddings):
        index[project_id].append({
            "source": c.get("source", "unknown"),
            "chunk_index": c.get("chunk_index", 0),
            "content": c.get("text", c.get("content", "")),
            "embedding": emb,
        })

    _save_index(index)



def delete_source(project_id: str, source: str) -> None:
    """Remove chunks for a given file source in a project."""
    index = _load_index()
    if project_id in index:
        index[project_id] = [c for c in index[project_id] if c.get("source") != source]
        _save_index(index)



def search(project_id: str, query_embedding: List[float], top_k: int | None = None, query_text: str = "") -> List[Dict[str, Any]]:
    """Perform hybrid cosine vector similarity and keyword retrieval over all indexed project chunks."""
    k = top_k or settings.top_k or 4

    # 1. Search disk-backed index
    index = _load_index()
    project_chunks = index.get(project_id, [])
    if not project_chunks:
        # Check case-insensitive match
        for pid, c_list in index.items():
            if pid.lower() == project_id.lower() or pid in project_id or project_id in pid:
                project_chunks = c_list
                break

    # Keyword terms for lexical ranking
    terms = [w.lower() for w in query_text.split() if len(w) > 2] if query_text else []

    scored: List[Dict[str, Any]] = []
    for c in project_chunks:
        emb = c.get("embedding", [])
        content = c.get("content", "")
        sim = _cosine_similarity(query_embedding, emb) if emb else 0.5
        
        # Keyword boost
        if terms:
            c_low = content.lower()
            keyword_hits = sum(1 for t in terms if t in c_low)
            sim += (keyword_hits * 0.15)

        scored.append({
            "source": c.get("source", "doc"),
            "content": content,
            "similarity": round(float(sim), 4)
        })

    # Sort descending by similarity score
    scored.sort(key=lambda x: x["similarity"], reverse=True)

    if scored:
        return scored[:k]

    return []

