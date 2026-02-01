"""Shared test fixtures and factory functions for testing."""

from typing import AsyncIterator
from unittest.mock import patch
from uuid import UUID, uuid4

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from voice_notes.main import app
from voice_notes.models.content import GeneratedContent
from voice_notes.models.notes import Note
from voice_notes.models.shared import Base
from voice_notes.services.database import get_session
from supertokens_python.recipe.session.framework.fastapi import verify_session

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
async def auth_headers() -> dict:
    """Create headers with SuperTokens session for authenticated requests."""
    # With SuperTokens, session cookies are handled automatically by the SDK
    # For testing, we would need to mock the session verification
    # Return empty dict as SuperTokens middleware handles session validation
    return {}


# ============================================================================
# Mock Session for Testing
# ============================================================================


class MockSessionContainer:
    """Mock SuperTokens SessionContainer for testing."""

    def __init__(self, user_id: UUID):
        self.user_id = user_id

    async def get_user_id(self) -> str:
        """Return the user ID as string."""
        return str(self.user_id)


@pytest.fixture
def mock_session(user_id: UUID):
    """Create a mock SuperTokens session."""
    return MockSessionContainer(user_id)


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


def verify_session_unauthorized():
    """Mock function that raises unauthorized error."""
    from fastapi import HTTPException, status
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized"
    )


@pytest.fixture
async def async_client(
    db: AsyncSession, mock_session
) -> AsyncIterator[httpx.AsyncClient]:
    """Create an async test client with authenticated session."""

    async def get_session_override():
        yield db

    # Override verify_session to return mock_session
    def verify_session_override():
        return mock_session

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[verify_session] = verify_session_override

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def async_client_unauth(
    db: AsyncSession,
) -> AsyncIterator[httpx.AsyncClient]:
    """Create an async test client without authentication."""

    async def get_session_override():
        yield db

    app.dependency_overrides[get_session] = get_session_override
    app.dependency_overrides[verify_session] = verify_session_unauthorized

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://test"
    ) as client:
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
