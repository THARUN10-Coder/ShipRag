"""Shared auth middleware for API key and JWT verification.

Services import verify_api_key() or verify_jwt() as FastAPI dependencies.
Auth verification calls the Auth Service internally to validate tokens.
"""
import hashlib
import httpx
from fastapi import HTTPException, Security, Depends
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
_bearer_scheme = HTTPBearer(auto_error=False)

# Set by each service at startup
AUTH_SERVICE_URL: str = "http://auth:8001"


class AuthUser(BaseModel):
    """Represents an authenticated user extracted from JWT or API key."""
    user_id: str
    email: str
    project_id: Optional[str] = None  # set when auth is via API key


def configure(auth_service_url: str):
    """Configure the auth middleware with the Auth Service URL."""
    global AUTH_SERVICE_URL
    AUTH_SERVICE_URL = auth_service_url


async def verify_api_key(
    api_key: Optional[str] = Security(_api_key_header),
) -> AuthUser:
    """FastAPI dependency: validate an API key via the Auth Service."""
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{AUTH_SERVICE_URL}/auth/verify-key",
                headers={"X-API-Key": api_key},
                timeout=5.0,
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid API key")

    data = resp.json()
    return AuthUser(
        user_id=data["user_id"],
        email=data.get("email", ""),
        project_id=data.get("project_id"),
    )


async def verify_jwt(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
) -> AuthUser:
    """FastAPI dependency: validate a JWT Bearer token via the Auth Service."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{AUTH_SERVICE_URL}/auth/me",
                headers={"Authorization": f"Bearer {credentials.credentials}"},
                timeout=5.0,
            )
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    data = resp.json()
    return AuthUser(user_id=data["user_id"], email=data["email"])


async def verify_any(
    api_key: Optional[str] = Security(_api_key_header),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
) -> AuthUser:
    """FastAPI dependency: accept either API key or JWT Bearer token."""
    if api_key:
        return await verify_api_key(api_key)
    if credentials:
        return await verify_jwt(credentials)
    raise HTTPException(
        status_code=401,
        detail="Provide either X-API-Key header or Authorization: Bearer <jwt>",
    )
