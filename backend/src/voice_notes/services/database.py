"""Database connection and session management."""

from typing import Iterator

from sqlalchemy import Engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from voice_notes.config.settings import get_settings

settings = get_settings()

_engine: Engine | None = None


def get_engine():
    """Get cached database engine."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            settings.DB_CONNECTION_STRING,
            echo=False,
            poolclass=StaticPool,
        )
    return _engine


def create_tables() -> None:
    """Create all tables in the database."""
    engine = get_engine()
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    """Get a database session."""
    with Session(get_engine()) as session:
        yield session
