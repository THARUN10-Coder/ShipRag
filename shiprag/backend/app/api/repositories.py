"""Application Data API endpoints backed by Firebase Firestore.

Exposes clean endpoints for:
- /api/repositories (List & Read Repository Metadata from Firestore)
- /api/activities (List Workspace Activity Feed from Firestore)
- /api/sync/jobs (List & Trigger Synchronization Jobs)
- /api/pr/reviews (Store & Retrieve AI Pull Request Reviews)
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.firestore_store import (
    get_all_repositories,
    save_repository,
    create_sync_job,
    complete_sync_job,
    save_pr_review,
    log_activity,
    get_recent_activities,
    DEFAULT_WORKSPACE_ID,
)

router = APIRouter()


class RepositoryUpsertRequest(BaseModel):
    id: str
    name: Optional[str] = None
    fullName: Optional[str] = None
    url: Optional[str] = None
    defaultBranch: Optional[str] = "main"
    fileCount: Optional[int] = 0
    chunkCount: Optional[int] = 0
    graphNodeCount: Optional[int] = 0
    syncStatus: Optional[str] = "synced"


class PRReviewRequest(BaseModel):
    repositoryId: str
    pullRequestId: int
    headSha: Optional[str] = "HEAD"
    summary: str
    riskScore: Optional[int] = 0
    findings: Optional[List[Dict[str, Any]]] = []
    status: Optional[str] = "COMPLETED"


@router.get("/repositories")
def list_repositories(workspace_id: str = DEFAULT_WORKSPACE_ID):
    """Retrieves all active repositories for the given workspace."""
    repos = get_all_repositories(workspace_id=workspace_id)
    return {"repositories": repos, "count": len(repos), "workspace_id": workspace_id}


@router.get("/repositories/{project_id}")
def get_single_repository(project_id: str):
    """Get single repository details and chunk count."""
    from app.core.vectorstore import _load_index
    index = _load_index()
    chunks = index.get(project_id, [])
    if not chunks:
        for pid, c_list in index.items():
            if pid.lower() == project_id.lower() or pid in project_id or project_id in pid:
                chunks = c_list
                project_id = pid
                break

    unique_files = list({c.get("source") for c in chunks if c.get("source")})
    return {
        "id": project_id,
        "name": project_id,
        "fileCount": len(unique_files),
        "chunkCount": len(chunks),
        "files": unique_files,
        "status": "synced" if chunks else "unindexed"
    }


@router.get("/repositories/{project_id}/graph")
def get_repository_ast_graph(project_id: str):
    """Returns the real static AST dependency graph for a repository."""
    from app.core.graph.builder import get_cached_graph, build_repository_graph
    graph = get_cached_graph(project_id)
    if graph:
        return graph.model_dump()
    
    # If not cached yet, try constructing from vectorstore chunks
    from app.core.vectorstore import _load_index
    index = _load_index()
    chunks = index.get(project_id, [])
    if not chunks:
        for pid, c_list in index.items():
            if pid.lower() == project_id.lower() or pid in project_id or project_id in pid:
                chunks = c_list
                project_id = pid
                break

    if chunks:
        files_data = []
        seen_files = set()
        for c in chunks:
            src = c.get("source", "")
            if src and src not in seen_files:
                seen_files.add(src)
                files_data.append({"path": src, "content": c.get("content", "")})
        
        if files_data:
            generated = build_repository_graph(project_id, files_data)
            return generated.model_dump()

    # Fallback to general cached graphs if any
    from app.core.graph.builder import _load_graph_store
    store = _load_graph_store()
    for k, v in store.items():
        if project_id.lower() in k.lower() or k.lower() in project_id.lower():
            return v

    return {
        "repository_id": project_id,
        "nodes": [],
        "edges": [],
        "stats": {"message": "No analyzable AST code files found for this repository."}
    }


@router.post("/repositories")
def upsert_repository(payload: RepositoryUpsertRequest):
    """Upserts repository metadata in Firestore."""
    repo_id = save_repository(payload.dict())
    return {"status": "success", "repository_id": repo_id}


@router.get("/activities")
def list_activities(limit: int = Query(default=10, le=50)):
    """Fetches real-time workspace activity stream."""
    activities = get_recent_activities(limit=limit)
    return {"activities": activities, "count": len(activities)}


@router.post("/pr/reviews")
def store_pr_review(payload: PRReviewRequest):
    """Persists an AI PR Review in Firestore."""
    review_id = save_pr_review(payload.dict())
    return {"status": "success", "review_id": review_id}
