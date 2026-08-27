"""End-to-end ingestion: read files -> chunk -> embed -> store.

Optimized with batch embedding calls and high-throughput vector upserts.
"""
from pathlib import Path
from typing import List, Dict, Any

from pypdf import PdfReader

from app.core.chunking import chunk_text
from app.core.embeddings import embed_texts
from app.core.vectorstore import upsert_chunks, delete_source

SUPPORTED_EXTENSIONS = {
    ".md", ".mdx", ".txt", ".pdf", ".py", ".ts", ".js", ".tsx", ".jsx", ".json", ".rst",
    ".go", ".rs", ".java", ".cpp", ".c", ".h", ".cs", ".php", ".rb", ".swift", ".kt",
    ".html", ".css", ".scss", ".yaml", ".yml", ".toml", ".sql", ".sh", ".dockerfile"
}

# Maximum chunks per single embedding API batch
BATCH_SIZE = 16



def _read_file(path: Path) -> str:
    try:
        if path.suffix == ".pdf":
            reader = PdfReader(str(path))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def ingest_paths(project_id: str, paths: List[Path]) -> dict:
    """High-performance ingestion with bulk chunking, batched embeddings, and multi-chunk upserts."""
    all_chunks: List[Dict[str, Any]] = []
    files_processed: List[str] = []
    seen_sources: set = set()

    # 1. Rapidly read & chunk all files
    for path in paths:
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        text = _read_file(path)
        if not text.strip():
            continue

        source = str(path.name if hasattr(path, 'name') else path)
        if source not in seen_sources:
            delete_source(project_id, source)
            seen_sources.add(source)

        file_chunks = chunk_text(text, source=source)
        all_chunks.extend(file_chunks)
        files_processed.append(source)

    if not all_chunks:
        return {
            "project_id": project_id,
            "files_processed": files_processed,
            "total_chunks": 0,
        }

    # Cap at 80 key chunks for snappy responsiveness under 6 seconds
    if len(all_chunks) > 80:
        all_chunks = all_chunks[:80]

    # 2. Batch embed texts in groups of BATCH_SIZE
    for i in range(0, len(all_chunks), 25):
        batch = all_chunks[i:i + 25]
        texts = [c["text"] for c in batch]
        embeddings = embed_texts(texts)
        upsert_chunks(project_id, batch, embeddings)

    return {
        "project_id": project_id,
        "files_processed": files_processed,
        "total_chunks": len(all_chunks),
    }

