"""Retrieval + Generation Service configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # API Keys / Credentials
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # Database (pgvector store)
    database_url: str = "postgresql://shiprag:shiprag@postgres:5432/shiprag_chunks"

    # Redis (cache + rate limiting)
    redis_url: str = "redis://redis:6379/0"
    query_cache_ttl_seconds: int = 3600  # 1 hour query result cache

    # Auth service
    auth_service_url: str = "http://auth:8001"

    # Models & Retrieval defaults
    embedding_model: str = "text-embedding-3-small"
    generation_model: str = "claude-sonnet-4-6"
    default_top_k: int = 5

    # Server
    host: str = "0.0.0.0"
    port: int = 8004


settings = Settings()
