# SHIPRAG Frontend-Backend Integration Contract

## Architecture Overview
The SHIPRAG system is a multi-repository AI code intelligence platform with a FastAPI Python backend and a Next.js React frontend.

---

## 1. Backend Service Details
- **Framework**: FastAPI (Python 3.11+)
- **Base URL**: `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL`)
- **Embeddings**: NVIDIA NIM `nvidia/nv-embedqa-e5-v5` (1024-dimensional dense vectors)
- **Vector Storage**: In-memory cosine search + disk-backed index (`project_vector_index.json`) + PostgreSQL pgvector
- **LLM Generation**: NVIDIA NIM `meta/llama-3.3-70b-instruct`


---

## 2. API Endpoints

### `GET /health`
- **Description**: Health check endpoint
- **Response**: `{"status": "ok"}`

### `GET /api/repositories`
- **Description**: Lists all vector-indexed GitHub repositories with file and chunk counts
- **Response**:
```json
{
  "repositories": [
    {
      "id": "ai-support-copilot",
      "name": "ai-support-copilot",
      "fullName": "github.com/THARUN10-Coder/ai-support-copilot",
      "fileCount": 50,
      "chunkCount": 136,
      "status": "active",
      "syncStatus": "synced",
      "lastSync": "Just now",
      "defaultBranch": "main",
      "embeddingDimension": 1024,
      "embeddingModel": "nvidia/nv-embedqa-e5-v5"
    }
  ],
  "total": 1
}
```

### `POST /api/ingest/github-repo`
- **Description**: Shallow clones a GitHub repository, filters code & doc files, generates 1024D embeddings, and stores them in the vector store.
- **Request Body**:
```json
{
  "repo_url": "https://github.com/THARUN10-Coder/ai-support-copilot",
  "project_id": "ai-support-copilot",
  "branch": "main"
}
```
- **Response**:
```json
{
  "status": "success",
  "project_id": "ai-support-copilot",
  "files_processed": 50,
  "total_chunks": 136,
  "message": "Successfully analyzed and indexed 136 chunks."
}
```

### `POST /api/query`
- **Description**: Hybrid Dense (1024D cosine) + BM25 keyword retrieval with Llama 3.3 70B grounded answer generation.
- **Request Body**:
```json
{
  "project_id": "ai-support-copilot",
  "question": "Explain the architecture, setup and pipelines in this repository",
  "top_k": 4
}
```
- **Response**:
```json
{
  "answer": "### Pipeline & Repository Analysis: ...",
  "sources": [
    {
      "source": "GITHUB_VERCEL_SETUP.md",
      "content": "...",
      "similarity": 0.98
    }
  ]
}
```

### `POST /api/webhook/github`
- **Description**: Automated push webhook listener with HMAC-SHA256 signature verification.

---

## 3. Frontend Mapping
- **Dashboard & Header**: Displays live backend connection status indicator (`● Connected`).
- **Repositories Page & Modal**: Triggers `POST /api/ingest/github-repo` and refreshes via `GET /api/repositories`.
- **AI Copilot (`/dashboard/copilot`)**: Sends questions to `POST /api/query` and parses real `SourceChunk` citations with similarity scores.
- **Code Search (`/dashboard/search`)**: Queries real chunks via `apiClient.query` and renders live snippet matches.
