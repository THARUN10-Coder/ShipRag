"""Unified Google Gemini AI Client Engine for SHIPRAG.

Provides clear, grounded, zero-hallucination code intelligence across:
- RAG Query & AI Copilot Chat
- PR Review Intelligence & Automated Code Analysis
- Code Search & Graph Insights

Uses Google Gemini 2.5 Flash / Pro via direct HTTP REST & SDK for maximum speed and accuracy.
"""
import os
import json
from typing import Optional, Dict, Any, List
import httpx

from app.core.config import settings

def get_gemini_api_key() -> str:
    """Retrieve Gemini API key from settings or environment."""
    return settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")


async def generate_gemini_content(
    prompt: str,
    system_instruction: Optional[str] = None,
    model: str = "gemini-3.6-flash",
    temperature: float = 0.2,
) -> Optional[str]:
    """Generate intelligent grounded responses using Google Gemini API."""
    api_key = get_gemini_api_key()
    if not api_key:
        return None

    model_clean = model.replace("models/", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_clean}:generateContent?key={api_key}"
    
    contents = []
    if system_instruction:
        # Pass system instruction in payload
        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": [
                {"role": "user", "parts": [{"text": prompt}]}
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 2048,
            }
        }
    else:
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": prompt}]}
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 2048,
            }
        }

    async with httpx.AsyncClient(timeout=25.0) as client:
        try:
            res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                print(f"[Gemini REST API Error]: {res.status_code} {res.text}")
        except Exception as e:
            print(f"[Gemini Request Exception]: {e}")
            
    return None


def generate_gemini_content_sync(
    prompt: str,
    system_instruction: Optional[str] = None,
    model: str = "gemini-3.6-flash",
    temperature: float = 0.2,
) -> Optional[str]:
    """Synchronous version of generate_gemini_content for sync FastAPI routes."""
    api_key = get_gemini_api_key()
    if not api_key:
        return None

    model_clean = model.replace("models/", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_clean}:generateContent?key={api_key}"
    payload: Dict[str, Any] = {
        "contents": [
            {"role": "user", "parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 2048,
        }
    }
    if system_instruction:
        payload["system_instruction"] = {
            "parts": [{"text": system_instruction}]
        }

    try:
        import urllib.request
        import urllib.error
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode() if e.fp else str(e)
        print(f"[Gemini HTTP Error]: {e.code} - {err_body}")
    except Exception as e:
        print(f"[Gemini Sync Request Exception]: {e}")

    return None
