"""GitHub App & OAuth integration engine for SHIPRAG.

Handles:
- GitHub App authentication (RS256 JWT generation for GitHub App)
- Installation Access Token acquisition & caching
- Personal Access Token & OAuth token support
- Repository, branch, pull request, files, diff and commit fetching
- Webhook signature validation
"""
import os
import time
import json
import hmac
import hashlib
from typing import Optional, Dict, Any, List
import httpx
import jwt

from app.core.config import settings

# In-memory dynamic runtime credentials cache
_runtime_credentials: Dict[str, str] = {}
_installation_token_cache: Dict[str, Any] = {"token": None, "expires_at": 0}


def set_runtime_credentials(creds: Dict[str, str]) -> None:
    """Store runtime credentials provided via dashboard settings."""
    global _runtime_credentials
    for k, v in creds.items():
        if v is not None:
            _runtime_credentials[k] = v.strip()


def get_credential(name: str) -> str:
    """Retrieve credential from runtime settings, pydantic settings, or environment variables."""
    if name in _runtime_credentials and _runtime_credentials[name]:
        return _runtime_credentials[name]
    val = getattr(settings, name, "")
    if val:
        return str(val)
    return os.getenv(name.upper(), "")


def generate_app_jwt() -> Optional[str]:
    """Generate an RS256 JWT for GitHub App authentication (valid for 10 minutes)."""
    app_id = get_credential("github_app_id")
    private_key = get_credential("github_app_private_key")

    if not app_id or not private_key:
        return None

    # Format private key if needed (handles newlines escaped as \n)
    if "\\n" in private_key:
        private_key = private_key.replace("\\n", "\n")

    now = int(time.time())
    payload = {
        "iat": now - 60,  # 1 minute clock drift grace period
        "exp": now + (10 * 60),  # 10 minutes max
        "iss": app_id,
    }

    try:
        token = jwt.encode(payload, private_key, algorithm="RS256")
        return token
    except Exception as e:
        print(f"[GitHub App JWT Error]: {e}")
        return None


async def get_github_auth_headers() -> Dict[str, str]:
    """Get HTTP authorization headers for GitHub API requests.
    
    Priority:
    1. GitHub App Installation Access Token (if app_id & private_key configured)
    2. GitHub Personal Access Token (PAT) / OAuth Token (if configured)
    3. Unauthenticated header for public GitHub API access.
    """
    global _installation_token_cache

    # 1. Check Personal Access Token / OAuth Token
    pat = get_credential("github_token")
    if pat:
        return {
            "Authorization": f"Bearer {pat}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "SHIPRAG-AI-Platform",
        }

    # 2. Check GitHub App Installation Token
    app_id = get_credential("github_app_id")
    private_key = get_credential("github_app_private_key")
    installation_id = get_credential("github_app_installation_id")

    if app_id and private_key:
        now = time.time()
        # Return cached installation token if still valid (with 60s safety buffer)
        if _installation_token_cache.get("token") and _installation_token_cache.get("expires_at", 0) > now + 60:
            return {
                "Authorization": f"Bearer {_installation_token_cache['token']}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "SHIPRAG-AI-Platform",
            }

        app_jwt = generate_app_jwt()
        if app_jwt:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # If installation_id not provided, find the first active installation
                if not installation_id:
                    inst_res = await client.get(
                        "https://api.github.com/app/installations",
                        headers={
                            "Authorization": f"Bearer {app_jwt}",
                            "Accept": "application/vnd.github.v3+json",
                            "User-Agent": "SHIPRAG-AI-Platform",
                        },
                    )
                    if inst_res.status_code == 200:
                        installations = inst_res.json()
                        if installations:
                            installation_id = str(installations[0].get("id"))

                if installation_id:
                    token_res = await client.post(
                        f"https://api.github.com/app/installations/{installation_id}/access_tokens",
                        headers={
                            "Authorization": f"Bearer {app_jwt}",
                            "Accept": "application/vnd.github.v3+json",
                            "User-Agent": "SHIPRAG-AI-Platform",
                        },
                    )
                    if token_res.status_code in (200, 201):
                        data = token_res.json()
                        token = data.get("token")
                        _installation_token_cache = {
                            "token": token,
                            "expires_at": now + 3500,  # ~1 hour
                        }
                        return {
                            "Authorization": f"Bearer {token}",
                            "Accept": "application/vnd.github.v3+json",
                            "User-Agent": "SHIPRAG-AI-Platform",
                        }

    # 3. Default fallback (public rate-limited API access)
    return {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "SHIPRAG-AI-Platform",
    }


def get_integration_status() -> Dict[str, Any]:
    """Get current status of GitHub integration."""
    has_pat = bool(get_credential("github_token"))
    has_app = bool(get_credential("github_app_id") and get_credential("github_app_private_key"))
    has_oauth = bool(get_credential("github_client_id") and get_credential("github_client_secret"))
    has_webhook = bool(get_credential("github_webhook_secret"))

    mode = "unconfigured"
    if has_app:
        mode = "github_app"
    elif has_pat:
        mode = "personal_token"
    elif has_oauth:
        mode = "oauth"

    return {
        "configured": has_pat or has_app or has_oauth,
        "auth_mode": mode,
        "has_app": has_app,
        "has_pat": has_pat,
        "has_oauth": has_oauth,
        "has_webhook_secret": has_webhook,
        "app_id": get_credential("github_app_id"),
        "installation_id": get_credential("github_app_installation_id"),
        "webhook_url": "http://localhost:8000/api/webhook/github",
    }


async def list_github_repositories() -> List[Dict[str, Any]]:
    """Fetch repositories accessible via GitHub App or Token."""
    headers = await get_github_auth_headers()
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Check if using GitHub App installation
        if "Authorization" in headers:
            # First try installation repositories endpoint
            res = await client.get("https://api.github.com/installation/repositories", headers=headers)
            if res.status_code == 200:
                data = res.json()
                repos = data.get("repositories", [])
                return [
                    {
                        "id": r["name"].lower(),
                        "name": r["name"],
                        "full_name": r["full_name"],
                        "owner": r["owner"]["login"],
                        "url": r["html_url"],
                        "default_branch": r.get("default_branch", "main"),
                        "description": r.get("description") or "GitHub Connected Repository",
                        "language": r.get("language") or "TypeScript",
                        "stars": r.get("stargazers_count", 0),
                        "open_issues_count": r.get("open_issues_count", 0),
                        "is_private": r.get("private", False),
                    }
                    for r in repos
                ]

            # Fallback to user repositories endpoint (for PAT / OAuth)
            user_res = await client.get("https://api.github.com/user/repos?sort=updated&per_page=30", headers=headers)
            if user_res.status_code == 200:
                repos = user_res.json()
                return [
                    {
                        "id": r["name"].lower(),
                        "name": r["name"],
                        "full_name": r["full_name"],
                        "owner": r["owner"]["login"],
                        "url": r["html_url"],
                        "default_branch": r.get("default_branch", "main"),
                        "description": r.get("description") or "GitHub Connected Repository",
                        "language": r.get("language") or "TypeScript",
                        "stars": r.get("stargazers_count", 0),
                        "open_issues_count": r.get("open_issues_count", 0),
                        "is_private": r.get("private", False),
                    }
                    for r in repos
                    if isinstance(r, dict)
                ]

    return []


async def list_github_pull_requests(owner: str, repo: str, state: str = "open") -> List[Dict[str, Any]]:
    """List pull requests for a given repository."""
    headers = await get_github_auth_headers()
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls?state={state}&per_page=20"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url, headers=headers)
        if res.status_code == 200:
            prs = res.json()
            return [
                {
                    "id": f"pr-{pr['number']}",
                    "number": pr["number"],
                    "title": pr["title"],
                    "state": pr["state"],
                    "repository": f"{owner}/{repo}",
                    "author": pr.get("user", {}).get("login", "unknown"),
                    "sourceBranch": pr.get("head", {}).get("ref", "feature"),
                    "targetBranch": pr.get("base", {}).get("ref", "main"),
                    "created_at": pr.get("created_at"),
                    "updated_at": pr.get("updated_at"),
                    "html_url": pr.get("html_url"),
                    "body": pr.get("body") or "",
                }
                for pr in prs
                if isinstance(pr, dict)
            ]
        elif res.status_code == 404:
            print(f"[GitHub API Notice] Repository {owner}/{repo} not found on GitHub or private without auth.")
    return []


async def get_github_pull_request_files(owner: str, repo: str, pull_number: int) -> List[Dict[str, Any]]:
    """Fetch changed files, status, patch diffs and line additions/deletions for a PR."""
    headers = await get_github_auth_headers()
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/files"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url, headers=headers)
        if res.status_code == 200:
            files = res.json()
            return [
                {
                    "filename": f["filename"],
                    "status": f.get("status", "modified"),
                    "additions": f.get("additions", 0),
                    "deletions": f.get("deletions", 0),
                    "changes": f.get("changes", 0),
                    "patch": f.get("patch", ""),
                    "raw_url": f.get("raw_url"),
                }
                for f in files
                if isinstance(f, dict)
            ]
    return []


async def get_github_pull_request_details(owner: str, repo: str, pull_number: int) -> Optional[Dict[str, Any]]:
    """Get single PR metadata from GitHub."""
    headers = await get_github_auth_headers()
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url, headers=headers)
        if res.status_code == 200:
            pr = res.json()
            return {
                "id": f"pr-{pr['number']}",
                "number": pr["number"],
                "title": pr["title"],
                "state": pr["state"],
                "repository": f"{owner}/{repo}",
                "author": pr.get("user", {}).get("login", "unknown"),
                "sourceBranch": pr.get("head", {}).get("ref", "feature"),
                "targetBranch": pr.get("base", {}).get("ref", "main"),
                "headSha": pr.get("head", {}).get("sha", ""),
                "baseSha": pr.get("base", {}).get("sha", ""),
                "changedFiles": pr.get("changed_files", 0),
                "additions": pr.get("additions", 0),
                "deletions": pr.get("deletions", 0),
                "body": pr.get("body") or "",
                "created_at": pr.get("created_at"),
                "updated_at": pr.get("updated_at"),
                "html_url": pr.get("html_url"),
            }
    return None
