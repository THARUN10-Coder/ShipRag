"""GitHub webhook handler for auto-redeploy on doc changes.

Verifies the X-Hub-Signature-256 header, extracts changed doc files
from the push payload, and triggers an async ingestion job.
"""
import hashlib
import hmac
import json

from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings
from app.core.queue import publish_ingest_job

router = APIRouter(tags=["webhook"])


def _verify_signature(payload: bytes, signature: str) -> bool:
    """Verify the GitHub webhook HMAC-SHA256 signature."""
    if not settings.github_webhook_secret:
        return False  # reject if no secret configured

    expected = hmac.new(
        settings.github_webhook_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(f"sha256={expected}", signature)


SUPPORTED_EXTENSIONS = {".md", ".txt", ".pdf", ".docx", ".csv", ".html"}


@router.post("/webhook/github")
async def github_webhook(request: Request):
    """Handle GitHub push webhooks.

    Extracts changed doc files from the push payload and triggers
    an ingestion job for the affected project.
    """
    # Verify signature
    signature = request.headers.get("X-Hub-Signature-256", "")
    body = await request.body()

    if not _verify_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = json.loads(body)
    event_type = request.headers.get("X-GitHub-Event", "")

    if event_type != "push":
        return {"status": "ignored", "reason": f"Event type '{event_type}' not handled"}

    # Extract changed doc files
    changed_files: set[str] = set()
    for commit in payload.get("commits", []):
        for f in commit.get("added", []) + commit.get("modified", []):
            from pathlib import Path
            if Path(f).suffix.lower() in SUPPORTED_EXTENSIONS:
                changed_files.add(f)

    if not changed_files:
        return {"status": "ignored", "reason": "No doc files changed"}

    # Determine project_id from repo
    repo_name = payload.get("repository", {}).get("full_name", "unknown")

    # Publish ingestion job
    job_id = await publish_ingest_job(
        project_id=repo_name.replace("/", "-"),
        user_id="github-webhook",
        files=list(changed_files),
    )

    return {
        "status": "triggered",
        "job_id": job_id,
        "files": list(changed_files),
    }
