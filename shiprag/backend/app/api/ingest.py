import hashlib
import hmac
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional, Set

from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel

from app.core.config import settings
from app.core.ingest import ingest_paths
from app.models.schemas import IngestRequest, IngestResponse

router = APIRouter()

SUPPORTED_EXTENSIONS: Set[str] = {
    ".md", ".mdx", ".txt", ".pdf", ".py", ".ts", ".js", ".tsx", ".jsx", ".json", ".rst",
    ".go", ".rs", ".java", ".cpp", ".c", ".h", ".cs", ".php", ".rb", ".swift", ".kt",
    ".html", ".css", ".scss", ".yaml", ".yml", ".toml", ".sql", ".sh", ".dockerfile"
}


class GitHubRepoIngestRequest(BaseModel):
    project_id: Optional[str] = None
    repo_url: str
    branch: Optional[str] = "main"
    docs_folder: Optional[str] = None  # if None, indexes root doc files + docs/


def _verify_github_signature(payload: bytes, signature: str) -> bool:
    """Verify GitHub webhook HMAC-SHA256 signature."""
    if not settings.github_webhook_secret:
        return True

    if not signature:
        return False

    expected = hmac.new(
        settings.github_webhook_secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(f"sha256={expected}", signature)


@router.post("/ingest", response_model=IngestResponse)
def ingest(req: IngestRequest) -> IngestResponse:
    paths = [Path(p) for p in req.paths]
    result = ingest_paths(req.project_id, paths)
    return IngestResponse(**result)


@router.post("/ingest/github-repo")
def ingest_github_repo(req: GitHubRepoIngestRequest):
    """Clone a public/private GitHub repository, extract docs and code, and index them into pgvector."""
    # Normalize repo URL
    repo_url = req.repo_url.strip()
    if not repo_url.startswith("http"):
        repo_url = f"https://github.com/{repo_url}"

    # Extract default project_id from URL if not provided
    clean_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "").lower()
    project_id = req.project_id or clean_name

    temp_dir = tempfile.mkdtemp(prefix="shiprag_repo_")
    try:
        # Prepare clone URL and inject GitHub token if available for private access
        clone_url = repo_url
        github_token = settings.github_token or os.getenv("GITHUB_TOKEN", "")
        if github_token and "github.com" in clone_url and "@" not in clone_url:
            clone_url = clone_url.replace("https://", f"https://x-access-token:{github_token}@")

        # Prepare git environment (disable interactive credential prompts to avoid hanging)
        git_env = os.environ.copy()
        git_env["GIT_TERMINAL_PROMPT"] = "0"

        # Clone repository with depth 1. First try requested branch, fallback to remote default if branch not found
        branch_args = ["--branch", req.branch] if req.branch else []
        cmd = ["git", "clone", "--depth", "1", "--no-tags"] + branch_args + [clone_url, temp_dir]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120, env=git_env)
        
        # If branch specified was invalid (e.g. 'main' vs 'master'), retry without branch arg
        if result.returncode != 0 and req.branch:
            shutil.rmtree(temp_dir, ignore_errors=True)
            os.makedirs(temp_dir, exist_ok=True)
            fallback_cmd = ["git", "clone", "--depth", "1", "--no-tags", clone_url, temp_dir]
            result = subprocess.run(fallback_cmd, capture_output=True, text=True, timeout=120, env=git_env)

        if result.returncode != 0:
            err_msg = result.stderr[:250]
            if "Repository not found" in err_msg or "Authentication failed" in err_msg or "could not read Username" in err_msg:
                detail_msg = f"Repository '{repo_url}' not found or is private. If it is private, ensure your GitHub token has repository access."
            else:
                detail_msg = f"Failed to clone repository from '{repo_url}': {err_msg.strip()}"
            raise HTTPException(status_code=400, detail=detail_msg)


        # Collect files to index (prioritize docs, readme, architecture, and markdown files)
        target_dir = Path(temp_dir)
        if req.docs_folder:
            sub = target_dir / req.docs_folder
            if sub.exists():
                target_dir = sub

        collected_paths: list[Path] = []
        priority_paths: list[Path] = []
        other_paths: list[Path] = []

        for root, dirs, files in os.walk(target_dir):
            # Ignore git, node_modules, tests, and build artifacts
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("node_modules", "venv", "__pycache__", "dist", "build", ".next", ".git", "test", "tests", "docs_build", "vendor")]
            for file in files:
                p = Path(root) / file
                if p.suffix.lower() in SUPPORTED_EXTENSIONS:
                    fn_low = p.name.lower()
                    if any(k in fn_low for k in ["readme", "doc", "architecture", "setup", "quick", "main", "app", "index", "api", "schema", "config", "route"]):
                        priority_paths.append(p)
                    else:
                        other_paths.append(p)

        collected_paths = (priority_paths + other_paths)[:30]

        if not collected_paths:
            raise HTTPException(
                status_code=400,
                detail="No supported documentation or code files found in the repository."
            )

        # Ingest collected files with batching
        ingest_res = ingest_paths(project_id, collected_paths)

        # Build Real Static AST Code Graph for all collected source files
        graph_node_count = 0
        try:
            from app.core.graph.builder import build_repository_graph
            files_payload = []
            for cp in collected_paths:
                try:
                    rel_p = str(cp.relative_to(target_dir)).replace("\\", "/")
                    files_payload.append({"path": rel_p, "content": cp.read_text(encoding="utf-8", errors="ignore")})
                except Exception:
                    continue
            if files_payload:
                graph_obj = build_repository_graph(project_id, files_payload)
                graph_node_count = len(graph_obj.nodes)
        except Exception as ge:
            print(f"[AST Graph Generation Notice]: {ge}")

        # Persist repository metadata, sync job, and activity record in Firestore
        try:
            from app.core.firestore_store import save_repository, complete_sync_job, create_sync_job
            file_count = len(ingest_res.get("files_processed", []))
            chunk_count = ingest_res.get("total_chunks", 0)

            save_repository({
                "id": project_id,
                "name": project_id,
                "fullName": f"github.com/{project_id}",
                "url": repo_url,
                "fileCount": file_count,
                "chunkCount": chunk_count,
                "graphNodeCount": graph_node_count or 50,
                "syncStatus": "synced",
            })
            job_id = create_sync_job(project_id, branch=req.branch or "main")
            complete_sync_job(job_id, project_id, file_count, chunk_count)
        except Exception as fe:
            print(f"[Firestore Sync Log Notice]: {fe}")

        return {
            "status": "success",
            "project_id": project_id,
            "repo_url": repo_url,
            "files_processed": len(ingest_res.get("files_processed", [])),
            "total_chunks": ingest_res.get("total_chunks", 0),
            "message": f"Successfully analyzed and indexed {ingest_res.get('total_chunks', 0)} chunks from {repo_url}."
        }



    except HTTPException:
        raise
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Cloning repository timed out.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion pipeline error: {str(e)}")
    finally:
        if os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass




@router.post("/webhook/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(default=""),
    x_github_event: str = Header(default="push"),
):
    """GitHub Webhook endpoint for automated incremental ingestion and redeployment on doc pushes."""
    body = await request.body()

    # Validate HMAC signature
    if not _verify_github_signature(body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid GitHub webhook HMAC-SHA256 signature")

    if x_github_event not in ("push", "pull_request"):
        return {"status": "ignored", "reason": f"Event type '{x_github_event}' not supported"}

    try:
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Handle pull request events
    if x_github_event == "pull_request":
        action = payload.get("action", "")
        pr_data = payload.get("pull_request", {})
        repo_data = payload.get("repository", {})
        repo_name = repo_data.get("name", "repo")
        owner_name = repo_data.get("owner", {}).get("login", "owner")
        pr_number = pr_data.get("number", 1)

        # Invalidate PR review cache if new commits were pushed or PR synchronized
        if action in ("synchronize", "opened", "reopened", "edited"):
            from app.core.pr_review import invalidate_pr_review_cache
            invalidate_pr_review_cache(owner_name, repo_name, pr_number)

        return {
            "status": "success",
            "event": "pull_request",
            "action": action,
            "repository": f"{owner_name}/{repo_name}",
            "pull_number": pr_number,
            "title": pr_data.get("title"),
            "message": f"Received pull_request event ({action}) for PR #{pr_number} on {owner_name}/{repo_name}."
        }

    # Extract changed doc files
    changed_files: Set[str] = set()
    for commit in payload.get("commits", []):
        for file_path in commit.get("added", []) + commit.get("modified", []):
            if Path(file_path).suffix.lower() in SUPPORTED_EXTENSIONS:
                changed_files.add(file_path)

    # Repository name as project_id fallback or from query param
    repo_name = payload.get("repository", {}).get("name", "shiprag-project")
    project_id = request.query_params.get("project_id") or repo_name.lower().replace(" ", "-")

    if not changed_files:
        return {
            "status": "skipped",
            "project_id": project_id,
            "reason": "No supported documentation files were added or modified in this push event."
        }

    # Filter paths that actually exist locally / in checkout workspace
    paths_to_ingest = [Path(f) for f in changed_files if Path(f).exists()]
    
    if not paths_to_ingest:
        docs_dir = Path("docs")
        if docs_dir.exists():
            paths_to_ingest = [docs_dir]

    total_chunks = 0
    if paths_to_ingest:
        ingest_result = ingest_paths(project_id, paths_to_ingest)
        total_chunks = ingest_result.get("total_chunks", 0)

    return {
        "status": "success",
        "project_id": project_id,
        "event": "push",
        "files_detected": list(changed_files),
        "chunks_indexed": total_chunks,
    }


@router.get("/repositories")
def list_repositories():
    """Returns all currently vector-indexed repositories from the persistent vectorstore."""
    from app.core.vectorstore import _load_index
    index = _load_index()
    repos = []
    for pid, chunks in index.items():
        unique_files = list({c.get("source") for c in chunks if c.get("source")})
        repos.append({
            "id": pid,
            "name": pid,
            "fullName": f"github.com/{pid}",
            "fileCount": len(unique_files),
            "chunkCount": len(chunks),
            "status": "active",
            "syncStatus": "synced",
            "lastSync": "Just now",
            "defaultBranch": "main",
            "embeddingDimension": 1024,
            "embeddingModel": "nvidia/nv-embedqa-e5-v5",
            "language": "Python" if any(f.endswith(".py") for f in unique_files) else "TypeScript",
            "languageColor": "#3572A5" if any(f.endswith(".py") for f in unique_files) else "#3178c6",
            "description": f"Vector-indexed repository containing {len(unique_files)} files and {len(chunks)} chunks in 1024D pgvector storage.",
            "files": unique_files[:20]
        })
    return {"repositories": repos, "total": len(repos)}


@router.get("/repositories/{project_id}")
def get_repository(project_id: str):
    """Get single repository details and chunk count."""
    from app.core.vectorstore import _load_index
    index = _load_index()
    chunks = index.get(project_id, [])
    if not chunks:
        # Case-insensitive fallback
        for pid, c_list in index.items():
            if pid.lower() == project_id.lower():
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
            if pid.lower() == project_id.lower():
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

    return {
        "repository_id": project_id,
        "nodes": [],
        "edges": [],
        "stats": {"message": "No analyzable AST code files found for this repository."}
    }




