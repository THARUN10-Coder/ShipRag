"""Ingestion Service configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Redis (job queue)
    redis_url: str = "redis://redis:6379/0"

    # File storage
    storage_dir: str = "/data/raw"

    # GitHub webhook
    github_webhook_secret: str = ""

    # Auth service (for verifying requests)
    auth_service_url: str = "http://auth:8001"

    # Server
    host: str = "0.0.0.0"
    port: int = 8002


settings = Settings()
