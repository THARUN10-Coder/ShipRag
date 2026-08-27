# SHIPRAG Firebase Firestore Setup & Data Architecture

## Architecture Overview
SHIPRAG separates application metadata persistence from vector chunk retrieval:

```
                    SHIPRAG
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
        Firebase             Vector DB
        Firestore            (1024D Embeddings)
             │                   │
             ↓                   ↓
      Application Data       Embeddings
      Metadata               Chunks
      Workspaces             Retrieval
      Repositories           AST Graphs
      Sync Jobs
      PR Reviews
      Activity Feed
```

---

## 1. Firebase Collections

### `repositories/{repository_id}`
- `workspace_id`: Identifier for tenant workspace
- `name`: Human-readable repository slug (e.g. `opengym`)
- `full_name`: GitHub full name
- `url`: Repository clone URL
- `file_count`: Total indexed source files
- `chunk_count`: Total indexed semantic chunks
- `graph_node_count`: Total AST Tree-sitter nodes
- `sync_status`: Current sync status (`SYNCED`, `INDEXING`, `FAILED`)
- `created_at`, `updated_at`: UTC ISO-8601 timestamps

### `sync_jobs/{sync_job_id}`
- `repository_id`: Target repository
- `commit_sha`: Git commit SHA indexed
- `branch`: Target branch (`main`)
- `status`: `INDEXING` | `SYNCED` | `FAILED`
- `files_indexed`, `chunks_indexed`
- `started_at`, `completed_at`

### `pr_reviews/{review_id}`
- `repository_id`: Associated repository
- `pull_request_id`: PR number
- `head_commit_sha`: Commit SHA analyzed
- `risk_score`: 0–100 risk assessment
- `summary`: Markdown review overview
- `findings`: Array of code review issue objects

### `activities/{activity_id}`
- `workspace_id`: Tenant workspace ID
- `repository_id`: Context repository
- `type`: `REPOSITORY_INDEXED`, `PR_REVIEW_COMPLETED`, `WEBHOOK_SYNC`
- `message`: Activity description
- `created_at`: UTC ISO-8601 timestamp

---

## 2. Environment Variables (`.env`)

Add the following to `backend/.env`:

```bash
FIREBASE_PROJECT_ID=shiprag-mvp
FIREBASE_CLIENT_EMAIL=your-service-account@shiprag-mvp.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Optional direct path to service account json
# FIREBASE_SERVICE_ACCOUNT_PATH=path/to/firebase-credentials.json
```

---

## 3. Server-Side Security
All Firebase Admin SDK operations remain strictly server-side inside FastAPI (`app/core/firestore_store.py`). No service account keys are exposed to the client or browser bundle.
