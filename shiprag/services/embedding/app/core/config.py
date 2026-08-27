"""Embedding Worker configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # Database (vector store)
    database_url: str = "postgresql://shiprag:shiprag@postgres:5432/shiprag_chunks"

    # OpenAI embeddings
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    embedding_dims: int = 1536
    embedding_batch_size: int = 100  # max texts per API call

    # Chunking
    chunk_size: int = 500
    chunk_overlap: int = 50

    # Worker
    consumer_group: str = "embedding-workers"
    consumer_name: str = "worker-1"

    # Server
    host: str = "0.0.0.0"
    port: int = 8003


settings = Settings()
