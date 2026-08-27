# SHIPRAG

> Push your docs → get a live RAG API + chat UI in seconds.

SHIPRAG is a "git push to deploy" platform for RAG (Retrieval-Augmented Generation)
pipelines — the same idea Vercel applied to frontends, applied to RAG apps.

## Repo structure

```
shiprag/
├── cli/                # TypeScript CLI (shiprag init / deploy / login)
├── backend/             # FastAPI service: ingestion, embeddings, retrieval, /query
├── dashboard/            # Next.js dashboard + auto-generated chat UI
├── .github/workflows/    # Example webhook-triggered redeploy action
└── README.md
```

## MVP flow

1. `shiprag login` — authenticate CLI with your SHIPRAG account
2. `shiprag init` — creates a `shiprag.config.json` in your repo, pointing at a `/docs` folder
3. `shiprag deploy` — ingests docs, chunks + embeds them into pgvector, deploys the
   FastAPI query service, and returns a live URL
4. Push new docs to the repo → GitHub webhook fires → auto re-embed → auto redeploy
5. Open the dashboard to see project status and chat with your docs

## Local development

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### CLI
```bash
cd cli
npm install
npm run build
npm link          # makes `shiprag` available globally for local testing
```

### Dashboard
```bash
cd dashboard
npm install
npm run dev
```

## Environment variables (backend/.env)
```
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
VERCEL_API_TOKEN=
GITHUB_WEBHOOK_SECRET=
```

## Status: All 6 Core MVP Phases Complete 🎉

1. ✅ **Phase 1: Architecture & DB Schema** — PostgreSQL + pgvector, hybrid BM25 search indices, tenant isolation, and docker-compose orchestration.
2. ✅ **Phase 2: Monolithic RAG Core** — Token chunker (`tiktoken`), embeddings generator (`text-embedding-3-small`), pgvector store, and hybrid `/api/query` streaming.
3. ✅ **Phase 3: Microservices Decomposition** — Auth (:8001), Ingestion (:8002), Embedding Worker (:8003), and Retrieval (:8004) services.
4. ✅ **Phase 4: Developer CLI** — TypeScript CLI (`shiprag login`, `register`, `init`, `deploy`).
5. ✅ **Phase 5: Next.js Dashboard & Playground** — Real-time metrics, live SSE query playground, citations badge, and vector inspector.
6. ✅ **Phase 6: CI/CD & Webhook Auto-Sync** — GitHub push webhook listener with HMAC-SHA256 signature verification and GitHub Actions redeploy workflow.

