"""Auth Service API routes.

Handles user registration, login, JWT issuance, API key management,
and project CRUD.
"""
from fastapi import APIRouter, HTTPException, Depends, Security, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.core.security import (
    hash_password, verify_password,
    create_access_token, decode_access_token,
    generate_api_key, hash_api_key,
)
from app.core import database as db

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=False)


# ── Auth dependency ──────────────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer),
) -> dict:
    """Extract and validate the current user from a JWT Bearer token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = await db.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ── Registration & Login ─────────────────────────────────────────────────────

@router.post("/register")
async def register(email: str, password: str, display_name: str = ""):
    existing = await db.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    pw_hash = hash_password(password)
    user = await db.create_user(email, pw_hash, display_name or email.split("@")[0])

    token = create_access_token(str(user["id"]), user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": str(user["id"]),
            "email": user["email"],
            "display_name": user["display_name"],
            "created_at": user["created_at"].isoformat(),
        },
    }


@router.post("/login")
async def login(email: str, password: str):
    user = await db.get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user["id"]), user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": str(user["id"]),
            "email": user["email"],
            "display_name": user["display_name"],
            "created_at": user["created_at"].isoformat(),
        },
    }


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "user_id": str(user["id"]),
        "email": user["email"],
        "display_name": user["display_name"],
        "created_at": user["created_at"].isoformat(),
    }


# ── API Key management ───────────────────────────────────────────────────────

@router.post("/apikeys")
async def create_key(
    project_id: str,
    label: str = "default",
    user: dict = Depends(get_current_user),
):
    raw_key, key_prefix, key_hash = generate_api_key()
    record = await db.create_api_key(
        str(user["id"]), project_id, key_prefix, key_hash, label
    )
    return {
        "key_id": str(record["id"]),
        "raw_key": raw_key,  # shown only once
        "key_prefix": record["key_prefix"],
        "project_id": record["project_id"],
        "label": record["label"],
        "created_at": record["created_at"].isoformat(),
    }


@router.get("/apikeys")
async def list_keys(user: dict = Depends(get_current_user)):
    keys = await db.get_api_keys_for_user(str(user["id"]))
    return [
        {
            "key_id": str(k["id"]),
            "key_prefix": k["key_prefix"],
            "project_id": k["project_id"],
            "label": k["label"],
            "last_used_at": k["last_used_at"].isoformat() if k["last_used_at"] else None,
            "created_at": k["created_at"].isoformat(),
        }
        for k in keys
    ]


@router.delete("/apikeys/{key_id}")
async def revoke_key(key_id: str, user: dict = Depends(get_current_user)):
    deleted = await db.delete_api_key(key_id, str(user["id"]))
    if not deleted:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"status": "revoked"}


@router.get("/verify-key")
async def verify_key(x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")):
    """Internal endpoint: other services call this to validate an API key."""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    key_hash = hash_api_key(x_api_key)
    record = await db.verify_api_key_hash(key_hash)
    if not record or not record.get("is_active"):
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")

    return {
        "user_id": str(record["user_id"]),
        "email": record["email"],
        "project_id": record["project_id"],
        "key_id": str(record["key_id"]),
    }


# ── Project management ───────────────────────────────────────────────────────

@router.post("/projects")
async def create_project(
    name: str,
    description: str = "",
    docs_dir: str = "./docs",
    user: dict = Depends(get_current_user),
):
    import uuid
    project_id = str(uuid.uuid4())
    project = await db.create_project(
        project_id, str(user["id"]), name, description, docs_dir
    )
    return {
        "project_id": project["project_id"],
        "name": project["name"],
        "description": project["description"],
        "chunk_count": project["chunk_count"],
        "last_synced_at": project["last_synced_at"],
        "created_at": project["created_at"].isoformat(),
    }


@router.get("/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    projects = await db.get_projects_for_user(str(user["id"]))
    return [
        {
            "project_id": p["project_id"],
            "name": p["name"],
            "description": p["description"],
            "chunk_count": p["chunk_count"],
            "last_synced_at": p["last_synced_at"].isoformat() if p["last_synced_at"] else None,
            "created_at": p["created_at"].isoformat(),
        }
        for p in projects
    ]
