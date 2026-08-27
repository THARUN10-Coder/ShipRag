"""GitHub REST API Router for SHIPRAG.

Provides endpoints for:
- Checking GitHub App & OAuth integration status
- Dynamic credential configuration (safe in-memory/runtime)
- Listing real GitHub repositories
- Listing and fetching live Pull Requests
- Triggering Grounded AI PR Intelligence reviews
"""
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel

from app.core.github import (
    get_integration_status,
    set_runtime_credentials,
    list_github_repositories,
    list_github_pull_requests,
    get_github_pull_request_details,
    get_github_pull_request_files,
)
from app.core.pr_review import analyze_pull_request

router = APIRouter(prefix="/github", tags=["github"])


class GitHubConfigPayload(BaseModel):
    github_token: Optional[str] = None
    github_app_id: Optional[str] = None
    github_app_private_key: Optional[str] = None
    github_app_installation_id: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    github_webhook_secret: Optional[str] = None


class AnalyzePRRequest(BaseModel):
    owner: str
    repo: str
    pull_number: int
    custom_pr_data: Optional[Dict[str, Any]] = None


@router.get("/status")
def github_status():
    """Returns the current status of GitHub App & Token integration."""
    return get_integration_status()


@router.post("/configure")
def configure_github(payload: GitHubConfigPayload):
    """Save GitHub App / OAuth credentials to backend runtime."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    set_runtime_credentials(data)
    return {
        "status": "success",
        "message": "GitHub credentials updated in backend runtime.",
        "integration": get_integration_status(),
    }


@router.get("/repositories")
async def get_github_repos():
    """List repositories accessible via GitHub App or personal token."""
    try:
        repos = await list_github_repositories()
        return {"repositories": repos, "total": len(repos)}
    except Exception as e:
        return {"repositories": [], "total": 0, "error": str(e)}


@router.get("/repositories/{owner}/{repo}/pulls")
async def get_repo_pull_requests(
    owner: str,
    repo: str,
    state: str = Query(default="open"),
):
    """List real pull requests for a given repository."""
    try:
        prs = await list_github_pull_requests(owner, repo, state=state)
        return {"pull_requests": prs, "total": len(prs)}
    except Exception as e:
        return {"pull_requests": [], "total": 0, "error": str(e)}


@router.get("/repositories/{owner}/{repo}/pulls/{number}")
async def get_pull_request_review(owner: str, repo: str, number: int):
    """Fetch live GitHub PR details, files, and generate AI PR Intelligence Review."""
    try:
        review_data = await analyze_pull_request(owner, repo, number)
        return review_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PR Review analysis error: {str(e)}")


@router.post("/analyze-pr")
async def analyze_pr_endpoint(payload: AnalyzePRRequest):
    """Analyze a specific PR or custom payload."""
    try:
        review_data = await analyze_pull_request(
            payload.owner,
            payload.repo,
            payload.pull_number,
            custom_pr_data=payload.custom_pr_data,
        )
        return review_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
