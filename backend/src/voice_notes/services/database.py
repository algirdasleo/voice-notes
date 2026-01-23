"""Database connection and session management."""

from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from voice_notes import models  # noqa: F401 - Import to register models
from voice_notes.config.settings import get_settings
from voice_notes.models.shared import Base

settings = get_settings()

_engine = None


def get_engine():
    """Get cached async database engine."""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.DB_CONNECTION_STRING,
            echo=False,
        )
    return _engine


async def create_tables() -> None:
    """Create all tables in the database."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncIterator[AsyncSession]:
    """Get an async database session."""
    engine = get_engine()
    async with AsyncSession(engine) as session:
        yield session
