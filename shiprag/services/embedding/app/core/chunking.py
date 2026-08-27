"""Enhanced chunking with multi-format file extraction.

Supports: .md, .txt, .pdf, .docx, .csv, .html
Uses fixed-size token chunking with overlap (same strategy as MVP).
"""
import csv
import io
from pathlib import Path

import tiktoken
from pypdf import PdfReader

from app.core.config import settings

_encoder = tiktoken.get_encoding("cl100k_base")


# ── File extraction ──────────────────────────────────────────────────────────

def _read_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def _read_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _read_docx(path: Path) -> str:
    """Extract text from .docx using zipfile (no external dependency)."""
    import zipfile
    import xml.etree.ElementTree as ET

    text_parts = []
    with zipfile.ZipFile(str(path)) as zf:
        with zf.open("word/document.xml") as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            for para in root.iter(f"{{{ns['w']}}}p"):
                texts = [t.text for t in para.iter(f"{{{ns['w']}}}t") if t.text]
                if texts:
                    text_parts.append("".join(texts))
    return "\n".join(text_parts)


def _read_csv(path: Path) -> str:
    """Convert CSV rows to text for embedding."""
    content = path.read_text(encoding="utf-8", errors="ignore")
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    if not rows:
        return ""
    # Use header row as field labels
    headers = rows[0]
    text_rows = []
    for row in rows[1:]:
        pairs = [f"{h}: {v}" for h, v in zip(headers, row) if v.strip()]
        text_rows.append(", ".join(pairs))
    return "\n".join(text_rows)


def _read_html(path: Path) -> str:
    """Strip HTML tags and extract text content."""
    import re
    content = path.read_text(encoding="utf-8", errors="ignore")
    # Remove script and style blocks
    content = re.sub(r"<script[^>]*>.*?</script>", "", content, flags=re.DOTALL)
    content = re.sub(r"<style[^>]*>.*?</style>", "", content, flags=re.DOTALL)
    # Remove tags
    content = re.sub(r"<[^>]+>", " ", content)
    # Collapse whitespace
    content = re.sub(r"\s+", " ", content).strip()
    return content


READERS = {
    ".md": _read_txt,
    ".txt": _read_txt,
    ".pdf": _read_pdf,
    ".docx": _read_docx,
    ".csv": _read_csv,
    ".html": _read_html,
    ".htm": _read_html,
}


def read_file(path: Path) -> str:
    """Read a file and return its text content."""
    reader = READERS.get(path.suffix.lower())
    if not reader:
        raise ValueError(f"Unsupported file type: {path.suffix}")
    return reader(path)


# ── Chunking ─────────────────────────────────────────────────────────────────

def chunk_text(text: str, source: str) -> list[dict]:
    """Split text into overlapping token-based chunks.

    Returns a list of {"text": str, "source": str, "chunk_index": int}.
    """
    tokens = _encoder.encode(text)
    step = settings.chunk_size - settings.chunk_overlap
    if step <= 0:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    chunks = []
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
