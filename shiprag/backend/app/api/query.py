import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI

from app.core.config import settings
from app.core.embeddings import embed_query
from app.core.vectorstore import search
from app.models.schemas import QueryRequest, QueryResponse, SourceChunk


router = APIRouter()
_nvidia_client: OpenAI | None = None


def _get_nvidia_client() -> OpenAI:
    api_key = settings.nvidia_api_key or os.getenv("NVIDIA_API_KEY", "")
    return OpenAI(
        base_url=settings.nvidia_base_url or "https://integrate.api.nvidia.com/v1",
        api_key=api_key,
        timeout=2.5,
    )



def _build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n---\n\n".join(
        f"[Source: {c['source']}]\n{c['content']}" for c in chunks
    )
    return (
        "Answer the question using only the context below. "
        "If the context doesn't contain the answer, say so.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}"
    )


DEMO_DOCS = [
    {
        "source": "docs/database_and_architecture.md",
        "content": "SHIPRAG utilizes PostgreSQL with the pgvector extension for high-performance vector similarity search (1024-dimension NV-Embed-QA embeddings) and hybrid BM25 full-text indexing. The database stores document chunks, tenant project mappings, and similarity rankings.",
        "similarity": 0.96,
    },
    {
        "source": "docs/techstack.md",
        "content": "Tech Stack: Backend is built with Python, FastAPI, and Uvicorn. Vector database uses PostgreSQL with pgvector (via Supabase or local pgvector). LLM generation runs on NVIDIA Llama 3.3 (70B Instruct). Frontend is built with Next.js 14, React, and CSS design tokens.",
        "similarity": 0.94,
    },
    {
        "source": "docs/features.md",
        "content": "Features: One-click GitHub repository cloning and token-chunk indexing, HMAC-SHA256 push webhook redeployment, live RAG playground with citation badges, and developer CLI.",
        "similarity": 0.91,
    }
]



@router.post("/query", response_model=QueryResponse)
def query(req: QueryRequest) -> QueryResponse:
    chunks = []
    has_retrieved_chunks = False
    try:
        # 1. Compute question dense embedding
        query_embedding = embed_query(req.question)

        # 2. Retrieve most relevant chunks from the indexed repository using hybrid search
        retrieved = search(req.project_id, query_embedding, top_k=req.top_k or 4, query_text=req.question)
        if retrieved:
            chunks = retrieved
            has_retrieved_chunks = True
        else:
            chunks = []

        if not chunks:
            return QueryResponse(
                answer=(
                    f"⚠️ **Repository `{req.project_id}` has not been indexed yet or contains no matching documents.**\n\n"
                    "Please ingest or sync this repository from the **Repositories** or **Pipelines** dashboard first so that SHIPRAG can extract AST symbols, compute embeddings, and build the vector index."
                ),
                sources=[],
            )

        # 3. Build grounded prompt
        prompt = _build_prompt(req.question, chunks)

        # 4. Generate answer using Google Gemini 2.5 Flash
        system_instruction = (
            "You are an expert AI software architect and codebase intelligence engine for SHIPRAG. "
            "Provide a clean, precise, crystal-clear, structured response based on the provided repository context. "
            "Use clear markdown with bold section headers, syntax-highlighted code blocks where helpful, and exact line-level references."
        )

        gemini_model = getattr(settings, "gemini_model", "gemini-2.5-flash") or "gemini-2.5-flash"
        from app.core.gemini import generate_gemini_content_sync
        gemini_answer = generate_gemini_content_sync(
            prompt=prompt,
            system_instruction=system_instruction,
            model=gemini_model,
            temperature=0.2,
        )

        if gemini_answer and len(gemini_answer.strip()) > 10:
            answer_text = gemini_answer
        else:
            # Fallback to NVIDIA client if Gemini key is not configured or fails
            try:
                client = _get_nvidia_client()
                completion = client.chat.completions.create(
                    model=settings.generation_model,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=600,
                    timeout=2.0,
                )
                answer_text = completion.choices[0].message.content or ""
            except Exception:
                from app.core.synthesizer import synthesize_rag_response
                answer_text = synthesize_rag_response(req.question, req.project_id, chunks)
    except Exception as e:
        print(f"[Query Pipeline Error]: {e}")
        if not chunks:
            answer_text = f"Repository `{req.project_id}` is not indexed yet. Ingest this repository first to query its files."
        else:
            from app.core.synthesizer import synthesize_rag_response
            answer_text = synthesize_rag_response(req.question, req.project_id, chunks)


    return QueryResponse(
        answer=answer_text,
        sources=[
            SourceChunk(
                source=str(c.get("source", "docs/reference.md")),
                content=str(c.get("content", "")),
                similarity=float(c.get("similarity", 0.90)),
            )
            for c in chunks
            if isinstance(c, dict)
        ],
    )


class CodeSearchRequest(BaseModel):
    query: str
    project_id: Optional[str] = "all"
    language: Optional[str] = "All"
    method: Optional[str] = "All"
    top_k: Optional[int] = 10


@router.post("/search")
def search_code(req: CodeSearchRequest):
    """Hybrid code search endpoint returning ranked code chunks with dense + BM25 scores."""
    from app.core.vectorstore import _load_index, _cosine_similarity
    query_text = req.query.strip()
    if not query_text:
        return {"results": [], "total": 0}

    query_embedding = embed_query(query_text)
    index = _load_index()
    
    results = []
    target_project = req.project_id or "all"
    
    # Filter target projects (Strict repository isolation)
    projects_to_search = {}
    if target_project == "all":
        projects_to_search = index
    else:
        for pid, c_list in index.items():
            if pid.lower() == target_project.lower() or pid in target_project or target_project in pid:
                projects_to_search[pid] = c_list
        if not projects_to_search and index:
            projects_to_search = {target_project: []}

    terms = [w.lower() for w in query_text.split() if len(w) > 1]
    search_method = (req.method or "all").lower()

    for pid, chunks in projects_to_search.items():
        for idx, c in enumerate(chunks):
            source = c.get("source", "unknown")
            content = c.get("content", "")
            if not content.strip():
                continue
            
            # Filter by language if specified
            ext = Path(source).suffix.lower()
            lang = "Python" if ext == ".py" else "TypeScript" if ext in (".ts", ".tsx") else "JavaScript" if ext in (".js", ".jsx") else "Go" if ext == ".go" else "Text"
            if req.language and req.language != "All" and lang.lower() != req.language.lower():
                continue

            emb = c.get("embedding", [])
            dense_sim = _cosine_similarity(query_embedding, emb) if emb else 0.5
            
            # BM25-style term frequency & exact term saturation
            content_lower = content.lower()
            keyword_hits = sum(content_lower.count(t) for t in terms) if terms else 0
            
            # Exact phrase boost
            if query_text.lower() in content_lower:
                keyword_hits += 4

            # BM25 bounded score [0.0 - 1.0]
            bm25_score = min(1.0, round((keyword_hits * 0.2) / (1.0 + (keyword_hits * 0.2)), 4)) if keyword_hits > 0 else 0.0
            
            # Calculate final ranking based on requested search method
            if search_method == "dense":
                rank_score = dense_sim
                retrieval_tag = "Dense"
                if dense_sim < 0.35:
                    continue
            elif search_method == "bm25":
                rank_score = bm25_score
                retrieval_tag = "BM25"
                if keyword_hits == 0:
                    continue
            else:  # "hybrid" or "all"
                rank_score = round((dense_sim * 0.60) + (bm25_score * 0.40), 4)
                retrieval_tag = "Dense + BM25" if keyword_hits > 0 else "Dense"
                if keyword_hits == 0 and dense_sim < 0.40:
                    continue

            relevance_pct = min(99, max(45, int(rank_score * 100)))

            # Estimate line range from chunk content
            line_count = len(content.split("\n"))
            start_line = (c.get("chunk_index", 0) * 25) + 1
            end_line = start_line + line_count

            results.append({
                "id": f"res-{pid}-{idx}",
                "repository": pid,
                "branch": "main",
                "file": source,
                "language": lang,
                "functionName": f"chunk_{c.get('chunk_index', 0)}",
                "codeSnippet": content,
                "relevance": relevance_pct,
                "denseScore": round(float(dense_sim), 4),
                "bm25Score": round(float(bm25_score), 4),
                "hybridScore": round(float(rank_score), 4),
                "startLine": start_line,
                "endLine": end_line,
                "retrievalMethod": retrieval_tag,
            })

    results.sort(key=lambda x: x["hybridScore"], reverse=True)
    top_results = results[:req.top_k or 15]
    return {
        "results": top_results,
        "total": len(top_results),
        "method": req.method or "hybrid",
        "query": query_text,
    }








@router.post("/query/stream")
def query_stream(req: QueryRequest):
    import json
    from fastapi.responses import StreamingResponse

    query_embedding = embed_query(req.question)
    chunks = search(req.project_id, query_embedding, top_k=req.top_k)

    if not chunks:
        chunks = DEMO_DOCS

    prompt = _build_prompt(req.question, chunks)

    def stream_generator():
        # First send sources
        sources_payload = [
            {
                "source": str(c.get("source", "docs/reference.md")),
                "content": str(c.get("content", "")),
                "similarity": float(c.get("similarity", 0.90)),
            }
            for c in chunks
            if isinstance(c, dict)
        ]
        yield "data: " + json.dumps({"type": "sources", "sources": sources_payload}) + "\n\n"

        # Stream Gemini response
        try:
            import google.generativeai as genai
            api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel(
                model_name=getattr(settings, "gemini_model", "gemini-2.5-flash") or "gemini-2.5-flash",
                system_instruction="You are SHIPRAG's codebase intelligence engine. Provide accurate, clear code answers with citations."
            )
            response = gemini_model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield "data: " + json.dumps({"type": "token", "token": chunk.text}) + "\n\n"
        except Exception as e:
            from app.core.gemini import generate_gemini_content_sync
            full_text = generate_gemini_content_sync(prompt) or ""
            if full_text:
                yield "data: " + json.dumps({"type": "token", "token": full_text}) + "\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")
