"""Tests for content endpoints."""

from uuid import UUID, uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import (
    create_content,
    create_note,
)


class TestContent:
    """Tests for content endpoints."""

    @pytest.mark.asyncio
    async def test_create_content(
        self,
        async_client,
        db: AsyncSession,
        user_id: UUID,
        auth_headers: dict,
    ):
        """Test creating generated content for a note."""
        note = await create_note(db, user_id)

        response = await async_client.post(
            "/content/",
            json={
                "note_id": str(note.id),
                "title": "Email",
                "content_type": "Email",
                "body": "Dear recipient, ...",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Email"
        assert data["note_id"] == str(note.id)

    @pytest.mark.asyncio
    async def test_create_content_requires_auth(self, async_client):
        """Test creating content without authentication fails."""
        response = await async_client.post(
            "/content/",
            json={
                "note_id": str(uuid4()),
                "title": "Test",
                "content_type": "Email",
                "body": "Body text",
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_contents(
        self,
        async_client,
        db: AsyncSession,
        user_id: UUID,
        auth_headers: dict,
    ):
        """Test getting all content for a note."""
        note = await create_note(db, user_id)
        await create_content(db, user_id, note.id, title="Email")

        response = await async_client.get(
            f"/content/{note.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "contents" in data
        assert len(data["contents"]) == 1

    @pytest.mark.asyncio
    async def test_get_contents_not_found(self, async_client, auth_headers: dict):
        """Test getting content for non-existent note."""
        response = await async_client.get(
            f"/content/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_content(
        self,
        async_client,
        db: AsyncSession,
        user_id: UUID,
        auth_headers: dict,
    ):
        """Test updating generated content."""
        note = await create_note(db, user_id)
        content = await create_content(db, user_id, note.id, title="Original Title")

        response = await async_client.put(
            f"/content/{content.id}",
            json={
                "title": "Updated Title",
                "body": "Updated body",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    @pytest.mark.asyncio
    async def test_update_content_not_found(self, async_client, auth_headers: dict):
        """Test updating non-existent content."""
        response = await async_client.put(
            f"/content/{uuid4()}",
            json={"title": "Updated"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_content(
        self,
        async_client,
        db: AsyncSession,
        user_id: UUID,
        auth_headers: dict,
    ):
        """Test deleting generated content."""
        note = await create_note(db, user_id)
        content = await create_content(db, user_id, note.id)

        response = await async_client.delete(
            f"/content/{content.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_content_not_found(self, async_client, auth_headers: dict):
        """Test deleting non-existent content."""
        response = await async_client.delete(
            f"/content/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404
