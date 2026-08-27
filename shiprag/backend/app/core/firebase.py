"""Centralized Firebase Admin SDK & Firestore client initialization.

Manages application data persistence (users, workspaces, repositories,
sync jobs, pull requests, PR reviews, and activity feeds) while keeping
vector embeddings and AST graph search cleanly in their respective stores.
"""
import os
import json
from typing import Optional, Any
from pathlib import Path

from app.core.config import settings

_firestore_client: Any = None
_firebase_app: Any = None
_is_initialized: bool = False


def initialize_firebase() -> Optional[Any]:
    """Initializes the Firebase Admin SDK once per process."""
    global _firestore_client, _firebase_app, _is_initialized
    if _is_initialized:
        return _firestore_client

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        # Check for existing apps
        if not firebase_admin._apps:
            # 1. Try service account file if provided in environment or root
            cred_file = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
            if not cred_file:
                # Check root directory for service account JSON
                candidates = list(Path(__file__).resolve().parent.parent.parent.glob("*firebase*.json"))
                if candidates:
                    cred_file = str(candidates[0])

            if cred_file and Path(cred_file).exists():
                cred = credentials.Certificate(cred_file)
                _firebase_app = firebase_admin.initialize_app(cred)
            elif os.getenv("FIREBASE_PRIVATE_KEY") and os.getenv("FIREBASE_CLIENT_EMAIL"):
                # Construct from individual env vars
                cert_info = {
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID", "shiprag-production"),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL", ""),
                }
                cred = credentials.Certificate(cert_info)
                _firebase_app = firebase_admin.initialize_app(cred)
            else:
                # Initialize default app (supports Google Application Default Credentials or local emulator)
                project_id = os.getenv("FIREBASE_PROJECT_ID", "shiprag-mvp")
                _firebase_app = firebase_admin.initialize_app(options={"projectId": project_id})

        _firestore_client = firestore.client()
        _is_initialized = True
        print("[Firebase]: Successfully connected to Firebase Firestore.")
        return _firestore_client
    except Exception as e:
        print(f"[Firebase Notice]: Running in hybrid local-fallback mode ({e})")
        _is_initialized = True
        return None


def get_db() -> Optional[Any]:
    """Returns the active Firestore client or None if running offline."""
    global _firestore_client, _is_initialized
    if not _is_initialized:
        initialize_firebase()
    return _firestore_client
