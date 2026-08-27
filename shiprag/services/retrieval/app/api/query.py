"""Retrieval & Generation API endpoints."""
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.vectorstore import search_chunks
from app.core.generation import generate_answer, generate_answer_stream
from app.core.cache import get_cached_query, set_cached_query
from services.shared.models import QueryRequest, QueryResponse, SourceChunk

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest) -> QueryResponse:
    # Check cache
    cached = await get_cached_query(req.project_id, req.question, req.top_k, req.use_hybrid)
    if cached:
        cached["cached"] = True
        return QueryResponse(**cached)

    chunks = await search_chunks(
        project_id=req.project_id,
        question=req.question,
        top_k=req.top_k or settings.default_top_k,
        use_hybrid=req.use_hybrid,
    )

    if not chunks:
        res = QueryResponse(
            answer="No indexed content found for this project yet.",
            sources=[],
            cached=False,
        )
        return res

    answer_text = generate_answer(req.question, chunks)
    sources = [
        SourceChunk(
            source=c["source"],
            content=c["content"],
            similarity=float(c.get("similarity", 0.0)),
        )
        for c in chunks
    ]

    response_data = {
        "answer": answer_text,
        "sources": [s.model_dump() for s in sources],
        "cached": False,
    }

    # Store cache
    await set_cached_query(req.project_id, req.question, req.top_k, req.use_hybrid, response_data)

    return QueryResponse(**response_data)


@router.post("/query/stream")
async def query_stream(req: QueryRequest):
    chunks = await search_chunks(
        project_id=req.project_id,
        question=req.question,
        top_k=req.top_k or settings.default_top_k,
        use_hybrid=req.use_hybrid,
    )

    if not chunks:
        async def empty_stream():
            yield "data: " + json.dumps({"answer": "No indexed content found for this project yet.", "sources": []}) + "\n\n"
        return StreamingResponse(empty_stream(), media_type="text/event-stream")

    async def event_generator():
        # First send sources
        sources_payload = [
            {"source": c["source"], "content": c["content"], "similarity": float(c.get("similarity", 0.0))}
            for c in chunks
        ]
        yield "data: " + json.dumps({"type": "sources", "sources": sources_payload}) + "\n\n"

        # Stream LLM tokens
        async for chunk in generate_answer_stream(req.question, chunks):
            yield "data: " + json.dumps({"type": "token", "token": chunk}) + "\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
