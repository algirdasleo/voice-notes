"""Shared test fixtures and factory functions for testing."""

from typing import AsyncIterator
from uuid import UUID, uuid4

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from voice_notes.api.dependencies import create_jwt, hash_password
from voice_notes.main import app
from voice_notes.models.content import GeneratedContent
from voice_notes.models.notes import Note
from voice_notes.models.shared import Base
from voice_notes.models.users import User
from voice_notes.services.database import get_session

# ============================================================================
# Database Fixtures
# ============================================================================


@pytest.fixture
async def db():
    """Create an in-memory SQLite database for testing."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = AsyncSession(engine, expire_on_commit=False)

    try:
        yield async_session
    finally:
        await async_session.close()
        await engine.dispose()


# ============================================================================
# User Fixtures
# ============================================================================


@pytest.fixture
async def user_id() -> UUID:
    """Generate a unique user ID for testing."""
    return uuid4()


@pytest.fixture
async def user(db: AsyncSession, user_id: UUID) -> User:
    """Create a test user in the database."""
    test_user = User(
        id=user_id,
        email="testuser@example.com",
        password_hash=hash_password("testpassword"),
    )
    db.add(test_user)
    await db.commit()
    # Ensure attributes are loaded before returning from async context
    await db.refresh(test_user)
    return test_user


@pytest.fixture
def test_user(user: User) -> User:
    """Alias for user fixture for backwards compatibility."""
    return user


@pytest.fixture
async def token(user_id: UUID) -> str:
    """Create a valid access token for testing."""
    return create_jwt(user_id, 600)


@pytest.fixture
async def auth_headers(token: str) -> dict:
    """Create headers with access token for authenticated requests."""
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# Factory Functions for Common Test Data
# ============================================================================


async def create_note(
    db: AsyncSession,
    user_id: UUID,
    title: str = "Test Note",
    transcription: str = "Test transcription",
) -> Note:
    """Factory function to create a note."""
    note = Note(
        id=uuid4(),
        user_id=user_id,
        title=title,
        transcription=transcription,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def create_content(
    db: AsyncSession,
    user_id: UUID,
    note_id: UUID,
    title: str = "Generated Content",
    content_type: str = "Email",
    body: str = "Content body",
) -> GeneratedContent:
    """Factory function to create generated content."""
    content = GeneratedContent(
        id=uuid4(),
        user_id=user_id,
        note_id=note_id,
        title=title,
        content_type=content_type,
        body=body,
    )
    db.add(content)
    await db.commit()
    await db.refresh(content)
    return content


# ============================================================================
# Override Dependencies for Testing
# ============================================================================


@pytest.fixture
async def async_client(db: AsyncSession) -> AsyncIterator[httpx.AsyncClient]:
    """Create an async test client with overridden dependencies."""

    async def get_session_override():
        yield db

    app.dependency_overrides[get_session] = get_session_override

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def ws_client(db: AsyncSession) -> AsyncIterator[TestClient]:
    """Create a async test client for WebSocket tests."""

    async def get_session_override():
        yield db

    app.dependency_overrides[get_session] = get_session_override

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
