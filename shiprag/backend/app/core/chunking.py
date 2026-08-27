"""Fixed-size token chunking with overlap.

MVP deliberately uses simple fixed-size chunking rather than semantic
chunking — good enough for v1, swap out later without touching callers.
"""
import tiktoken

from app.core.config import settings

_encoder = tiktoken.get_encoding("cl100k_base")


def chunk_text(text: str, source: str) -> list[dict]:
    """Split text into overlapping token-based chunks.

    Returns a list of {"text": str, "source": str, "chunk_index": int}.
    """
    tokens = _encoder.encode(text)
    chunks = []
    step = settings.chunk_size - settings.chunk_overlap
    if step <= 0:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    idx = 0
    chunk_index = 0
    while idx < len(tokens):
        window = tokens[idx: idx + settings.chunk_size]
        chunk_text_str = _encoder.decode(window)
        chunks.append({
            "text": chunk_text_str,
            "source": source,
            "chunk_index": chunk_index,
        })
        chunk_index += 1
        idx += step

    return chunks


# TODO: add file-type-specific extraction (pdf via pypdf, md front-matter
# stripping) before this function is called — see core/ingest.py
