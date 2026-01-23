"""Tests for notes endpoints."""

from uuid import UUID, uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import create_note


class TestNotes:
    """Tests for notes endpoints."""

    @pytest.mark.asyncio
    async def test_create_note(
        self,
        async_client,
        user_id: UUID,
        auth_headers: dict,
    ):
        """Test creating a new voice note."""
        response = await async_client.post(
            "/notes/",
            json={
                "title": "Test Note",
                "transcription": "This is a test note",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Note"
        assert data["user_id"] == str(user_id)

    @pytest.mark.asyncio
    async def test_create_note_requires_auth(self, async_client):
        """Test creating a note without authentication fails."""
        response = await async_client.post(
            "/notes/",
            json={
                "title": "Test Note",
                "transcription": "This is a test note",
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_notes(self, async_client, auth_headers: dict):
        """Test getting all notes for authenticated user."""
        response = await async_client.get(
            "/notes/",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "notes" in data
        assert isinstance(data["notes"], list)

    @pytest.mark.asyncio
    async def test_get_notes_requires_auth(self, async_client):
        """Test getting notes without authentication fails."""
        response = await async_client.get("/notes/")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_note(
        self,
        async_client,
        db: AsyncSession,
        user_id: UUID,
        auth_headers: dict,
    ):
        """Test updating a voice note."""
        note = await create_note(db, user_id, title="Original Title")

        response = await async_client.put(
            f"/notes/{note.id}",
            json={
                "title": "Updated Title",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    @pytest.mark.asyncio
    async def test_update_note_not_found(self, async_client, auth_headers: dict):
        """Test updating a non-existent note."""
        response = await async_client.put(
            f"/notes/{uuid4()}",
            json={"title": "Updated Title"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_note(
        self,
        async_client,
        db: AsyncSession,
        user_id: UUID,
        auth_headers: dict,
    ):
        """Test deleting a voice note."""
        note = await create_note(db, user_id, title="Note to Delete")

        response = await async_client.delete(
            f"/notes/{note.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_note_not_found(self, async_client, auth_headers: dict):
        """Test deleting a non-existent note."""
        response = await async_client.delete(
            f"/notes/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404
