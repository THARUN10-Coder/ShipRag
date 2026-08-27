"""Auth Service configuration.

Reads from environment variables, with sensible defaults for local
docker-compose development.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql://shiprag:shiprag@postgres:5432/shiprag_auth"

    # JWT
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 72

    # Server
    host: str = "0.0.0.0"
    port: int = 8001


settings = Settings()
