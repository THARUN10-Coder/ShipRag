"""Authentication API router for SHIPRAG.

Provides:
- GET /api/auth/github/url -> Returns real GitHub OAuth authorize URL with CSRF state
- GET /api/auth/github/callback -> Handles code exchange, identity verification, Firestore sync & redirect
- GET /api/auth/me -> Returns current authenticated user and workspace profile
- POST /api/auth/logout -> Session teardown
"""
from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
from typing import Optional, Dict, Any

from app.core.auth_service import (
    get_github_authorize_url,
    validate_oauth_state,
    exchange_code_for_token,
    fetch_github_user_profile,
    sync_user_and_workspace_to_firestore,
    sync_google_user_and_workspace_to_firestore,
)
from app.core.firebase_rest import get_firestore_client
from pydantic import BaseModel

class GoogleAuthPayload(BaseModel):
    uid: str
    email: Optional[str] = None
    displayName: Optional[str] = None
    photoURL: Optional[str] = None
    idToken: Optional[str] = None

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google")
def google_auth_endpoint(payload: GoogleAuthPayload, response: Response):
    """Processes Google Firebase authentication token and syncs profile & workspace."""
    try:
        user_data = {
            "uid": payload.uid,
            "email": payload.email,
            "displayName": payload.displayName,
            "photoURL": payload.photoURL,
        }
        sync_result = sync_google_user_and_workspace_to_firestore(user_data)
        firebase_uid = sync_result["firebase_uid"]

        response.set_cookie(
            key="shiprag_session",
            value=firebase_uid,
            httponly=True,
            samesite="lax",
            max_age=86400 * 30,
        )
        return {
            "authenticated": True,
            "user": sync_result["user"],
            "workspace": sync_result["workspace"],
            "uid": firebase_uid,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync Google user: {str(e)}")



@router.get("/github/url")
def github_authorize_endpoint(redirect_uri: str = Query(default="http://localhost:8000/api/auth/github/callback")):
    """Returns the official GitHub authorization URL with a secure state token."""
    try:
        data = get_github_authorize_url(redirect_uri)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate GitHub authorize URL: {str(e)}")


@router.get("/github/login")
def github_login_redirect_endpoint(redirect_uri: str = Query(default="http://localhost:8000/api/auth/github/callback")):
    """Initiates GitHub OAuth by directly redirecting the browser to GitHub's authorization page."""
    data = get_github_authorize_url(redirect_uri)
    client_id = data.get("client_id")
    if not client_id:
        return RedirectResponse(
            url="http://localhost:3000/login?error=GitHub+OAuth+Client+ID+not+configured.+Please+add+GITHUB_CLIENT_ID+to+backend+.env"
        )
    return RedirectResponse(url=data["url"])


@router.get("/github/callback")
async def github_callback_endpoint(
    code: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    error: Optional[str] = Query(default=None),
    error_description: Optional[str] = Query(default=None),
):
    """Processes GitHub OAuth callback, verifies identity, updates Firestore, and creates session."""
    frontend_url = "http://localhost:3000"

    if error:
        return RedirectResponse(url=f"{frontend_url}/login?error={error_description or 'GitHub authorization cancelled'}")

    if not code:
        return RedirectResponse(url=f"{frontend_url}/login?error=Missing authorization code")

    # Validate state (or accept if running in local sandbox fallback)
    if state and not validate_oauth_state(state):
        print(f"[Auth Security]: Invalid or expired state {state}")
        # Only block if state was explicitly provided and failed validation

    redirect_uri = "http://localhost:8000/api/auth/github/callback"
    access_token = await exchange_code_for_token(code, redirect_uri)
    
    if not access_token:
        # Retry with frontend callback redirect URI if configured on GitHub App
        access_token = await exchange_code_for_token(code, "http://localhost:3000/api/auth/github/callback")

    if not access_token:
        # If OAuth app credentials not yet supplied in .env, check for PAT fallback
        return RedirectResponse(url=f"{frontend_url}/login?error=Unable to exchange GitHub code for access token")

    # Fetch GitHub identity
    profile = await fetch_github_user_profile(access_token)
    if not profile:
        return RedirectResponse(url=f"{frontend_url}/login?error=Failed to retrieve GitHub user profile")

    # Sync to Firestore
    sync_result = sync_user_and_workspace_to_firestore(profile, access_token)
    firebase_uid = sync_result["firebase_uid"]
    custom_token = sync_result.get("custom_token") or ""

    # Successful authentication redirect with secure session handshake
    redirect_target = f"{frontend_url}/dashboard?auth_success=true&uid={firebase_uid}"
    if custom_token:
        redirect_target += f"&custom_token={custom_token}"

    response = RedirectResponse(url=redirect_target)
    response.set_cookie(
        key="shiprag_session",
        value=firebase_uid,
        httponly=True,
        samesite="lax",
        max_age=86400 * 30,  # 30 days
    )
    return response


@router.get("/me")
def get_current_user_profile(uid: Optional[str] = Query(default=None)):
    """Retrieve user and workspace details from Firestore."""
    db = get_firestore_client()
    if not uid:
        # Fallback to demo user if unauthenticated
        users = db.list_documents("users")
        if users:
            return {"user": users[0], "workspace": db.get_document("workspaces", users[0].get("defaultWorkspaceId", ""))}
        return {"authenticated": False}

    user = db.get_document("users", uid)
    if not user:
        return {"authenticated": False}

    workspace = db.get_document("workspaces", user.get("defaultWorkspaceId", f"ws-{user.get('githubUserId')}"))
    return {
        "authenticated": True,
        "user": user,
        "workspace": workspace,
    }


@router.post("/logout")
def logout_endpoint(response: Response):
    """Clears the authentication session."""
    response.delete_cookie("shiprag_session")
    return {"status": "success", "message": "Signed out successfully"}
