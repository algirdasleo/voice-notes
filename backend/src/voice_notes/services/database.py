"""Database connection and session management."""

from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from voice_notes.config.settings import get_settings

settings = get_settings()


def get_engine():
    """Get cached database engine."""
    return create_engine(
        settings.DB_CONNECTION_STRING,
        echo=False,
        poolclass=StaticPool,
    )


def create_tables() -> None:
    """Create all tables in the database."""
    engine = get_engine()
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    """Get a database session."""
    engine = get_engine()
    return Session(engine)
