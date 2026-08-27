from pydantic import BaseModel


class QueryRequest(BaseModel):
    project_id: str
    question: str
    top_k: int | None = None


class SourceChunk(BaseModel):
    source: str
    content: str
    similarity: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


class IngestRequest(BaseModel):
    project_id: str
    paths: list[str]  # absolute or repo-relative file paths already on disk


class IngestResponse(BaseModel):
    project_id: str
    files_processed: list[str]
    total_chunks: int
