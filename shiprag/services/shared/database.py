"""Shared database connection helper for all services.

Each service calls get_engine() with its own database URL. Connection pooling
is handled by SQLAlchemy's async engine.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from contextlib import asynccontextmanager
from typing import AsyncGenerator

_engines: dict[str, any] = {}
_session_factories: dict[str, async_sessionmaker] = {}


def get_engine(database_url: str):
    """Get or create an async SQLAlchemy engine for the given URL."""
    if database_url not in _engines:
        # Convert postgres:// to postgresql+asyncpg://
        async_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
        _engines[database_url] = create_async_engine(
            async_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            echo=False,
        )
        _session_factories[database_url] = async_sessionmaker(
            bind=_engines[database_url],
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _engines[database_url]


def get_session_factory(database_url: str) -> async_sessionmaker:
    """Get the session factory for the given database URL."""
    get_engine(database_url)  # ensure engine is created
    return _session_factories[database_url]


@asynccontextmanager
async def get_session(database_url: str) -> AsyncGenerator[AsyncSession, None]:
    """Async context manager that yields a database session."""
    factory = get_session_factory(database_url)
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
