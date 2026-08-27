"""Centralized Firebase Firestore connector via authenticated REST client.

Provides ultra-fast, robust, native REST integration directly with
Google Cloud Firestore for project 'shiprag' without gRPC channel quirks on Windows.
"""
import os
import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List
from pathlib import Path

from google.oauth2 import service_account
from google.auth.transport.requests import Request

_credentials = None
_project_id = "shiprag"


def _get_credentials():
    global _credentials, _project_id
    if _credentials is not None and _credentials.valid:
        return _credentials

    cred_file = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")
    backend_dir = Path(__file__).resolve().parent.parent.parent
    cred_path = backend_dir / cred_file if not Path(cred_file).is_absolute() else Path(cred_file)

    if not cred_path.exists():
        candidates = list(backend_dir.glob("*firebase*.json"))
        if candidates:
            cred_path = candidates[0]

    if cred_path.exists():
        with open(cred_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            _project_id = data.get("project_id", "shiprag")
        _credentials = service_account.Credentials.from_service_account_file(
            str(cred_path),
            scopes=["https://www.googleapis.com/auth/datastore"]
        )
    return _credentials


def _get_auth_header() -> Dict[str, str]:
    cred = _get_credentials()
    if cred:
        if not cred.valid:
            cred.refresh(Request())
        return {
            "Authorization": f"Bearer {cred.token}",
            "Content-Type": "application/json"
        }
    return {"Content-Type": "application/json"}


def _encode_value(val: Any) -> Dict[str, Any]:
    """Converts a Python value to a Firestore REST Typed Value."""
    if val is None:
        return {"nullValue": None}
    elif isinstance(val, bool):
        return {"booleanValue": val}
    elif isinstance(val, int):
        return {"integerValue": str(val)}
    elif isinstance(val, float):
        return {"doubleValue": val}
    elif isinstance(val, str):
        return {"stringValue": val}
    elif isinstance(val, list):
        return {"arrayValue": {"values": [_encode_value(v) for v in val]}}
    elif isinstance(val, dict):
        return {"mapValue": {"fields": {k: _encode_value(v) for k, v in val.items()}}}
    return {"stringValue": str(val)}


def _decode_value(val_dict: Dict[str, Any]) -> Any:
    """Converts a Firestore REST Typed Value back to Python."""
    if "stringValue" in val_dict:
        return val_dict["stringValue"]
    if "integerValue" in val_dict:
        return int(val_dict["integerValue"])
    if "doubleValue" in val_dict:
        return float(val_dict["doubleValue"])
    if "booleanValue" in val_dict:
        return val_dict["booleanValue"]
    if "nullValue" in val_dict:
        return None
    if "arrayValue" in val_dict:
        return [_decode_value(v) for v in val_dict.get("arrayValue", {}).get("values", [])]
    if "mapValue" in val_dict:
        return {k: _decode_value(v) for k, v in val_dict.get("mapValue", {}).get("fields", {}).items()}
    return None


class FirestoreRestClient:
    """Production REST API client for Firebase Firestore."""

    def __init__(self, project_id: str = "shiprag"):
        self.project_id = project_id
        self.base_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents"

    def set_document(self, collection: str, doc_id: str, fields: Dict[str, Any]) -> bool:
        """Upserts a document into a collection."""
        url = f"{self.base_url}/{collection}/{doc_id}"
        firestore_fields = {k: _encode_value(v) for k, v in fields.items()}
        payload = json.dumps({"fields": firestore_fields}).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers=_get_auth_header(),
            method="PATCH"
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status in (200, 201)
        except Exception as e:
            print(f"[Firestore REST Upsert Error {collection}/{doc_id}]: {e}")
            return False

    def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single document by ID."""
        url = f"{self.base_url}/{collection}/{doc_id}"
        req = urllib.request.Request(url, headers=_get_auth_header())
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                fields = data.get("fields", {})
                res = {k: _decode_value(v) for k, v in fields.items()}
                res["id"] = doc_id
                return res
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            print(f"[Firestore REST Get Error {collection}/{doc_id}]: {e}")
            return None
        except Exception as e:
            print(f"[Firestore REST Get Error {collection}/{doc_id}]: {e}")
            return None

    def list_documents(self, collection: str) -> List[Dict[str, Any]]:
        """Lists all documents in a collection."""
        url = f"{self.base_url}/{collection}"
        req = urllib.request.Request(url, headers=_get_auth_header())
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                results = []
                for doc in data.get("documents", []):
                    name_parts = doc.get("name", "").split("/")
                    doc_id = name_parts[-1] if name_parts else "unknown"
                    fields = doc.get("fields", {})
                    item = {k: _decode_value(v) for k, v in fields.items()}
                    item["id"] = doc_id
                    results.append(item)
                return results
        except Exception as e:
            print(f"[Firestore REST List Error {collection}]: {e}")
            return []


_client_instance = None


def get_firestore_client() -> FirestoreRestClient:
    global _client_instance
    if _client_instance is None:
        _get_credentials()
        _client_instance = FirestoreRestClient(project_id=_project_id)
    return _client_instance
