"""Central settings for the SHIPRAG backend.

Loads from environment variables / .env file. Keep every external
credential here — nothing else in the app should read os.environ directly.
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_env_path = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_env_path), extra="ignore")


    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"

    supabase_url: str = ""
    supabase_service_key: str = ""

    vercel_api_token: str = ""
    github_webhook_secret: str = ""

    # GitHub App & OAuth integration credentials
    github_token: str = ""
    github_app_id: str = ""
    github_app_private_key: str = ""
    github_app_installation_id: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""

    embedding_model: str = "models/gemini-embedding-001"
    embedding_dims: int = 3072


    generation_model: str = "gemini-3.6-flash"

    chunk_size: int = 500       # tokens per chunk
    chunk_overlap: int = 50     # tokens of overlap between chunks
    top_k: int = 5              # chunks retrieved per query


settings = Settings()
