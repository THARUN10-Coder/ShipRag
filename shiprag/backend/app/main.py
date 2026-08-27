from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import query, ingest, github_api, repositories, auth

app = FastAPI(title="SHIPRAG", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: lock down to dashboard origin before real deploy
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(query.router, prefix="/api", tags=["query"])
app.include_router(ingest.router, prefix="/api", tags=["ingest"])
app.include_router(github_api.router, prefix="/api", tags=["github"])
app.include_router(repositories.router, prefix="/api", tags=["repositories"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "SHIPRAG Backend", "firestore": "connected"}
