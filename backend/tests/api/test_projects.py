"""Tests for projects endpoints."""

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import create_note, create_project


class TestProjects:
    """Tests for projects CRUD endpoints."""

    @pytest.mark.asyncio
    async def test_create_project(
        self,
        async_client,
        user_id: str,
        auth_headers: dict,
    ):
        """Test creating a new project."""
        response = await async_client.post(
            "/projects/",
            json={
                "name": "Test Project",
                "description": "A test project",
                "icon": "Folder",
                "color": "blue",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Project"
        assert data["description"] == "A test project"
        assert data["icon"] == "Folder"
        assert data["color"] == "blue"
        assert data["user_id"] == str(user_id)
        assert data["note_count"] == 0

    @pytest.mark.asyncio
    async def test_create_project_requires_auth(self, async_client_unauth):
        """Test creating a project without authentication fails."""
        response = await async_client_unauth.post(
            "/projects/",
            json={"name": "Test Project"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_projects(self, async_client, auth_headers: dict):
        """Test getting all projects for authenticated user."""
        response = await async_client.get(
            "/projects/",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_get_projects_requires_auth(self, async_client_unauth):
        """Test getting projects without authentication fails."""
        response = await async_client_unauth.get("/projects/")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_project_by_id(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test getting a single project by ID."""
        project = await create_project(db, user_id, name="My Project")

        response = await async_client.get(
            f"/projects/{project.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "My Project"

    @pytest.mark.asyncio
    async def test_get_project_not_found(self, async_client, auth_headers: dict):
        """Test getting a non-existent project."""
        response = await async_client.get(
            f"/projects/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_project(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test updating a project."""
        project = await create_project(db, user_id, name="Original Name")

        response = await async_client.put(
            f"/projects/{project.id}",
            json={"name": "Updated Name", "color": "red"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["color"] == "red"

    @pytest.mark.asyncio
    async def test_update_project_not_found(self, async_client, auth_headers: dict):
        """Test updating a non-existent project."""
        response = await async_client.put(
            f"/projects/{uuid4()}",
            json={"name": "Updated Name"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_project(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test deleting a project."""
        project = await create_project(db, user_id, name="To Delete")

        response = await async_client.delete(
            f"/projects/{project.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_project_not_found(self, async_client, auth_headers: dict):
        """Test deleting a non-existent project."""
        response = await async_client.delete(
            f"/projects/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestProjectNotes:
    """Tests for project-note assignment endpoints."""

    @pytest.mark.asyncio
    async def test_add_notes_to_project(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test adding notes to a project."""
        project = await create_project(db, user_id)
        note1 = await create_note(db, user_id, title="Note 1")
        note2 = await create_note(db, user_id, title="Note 2")

        response = await async_client.post(
            f"/projects/{project.id}/notes",
            json={"note_ids": [str(note1.id), str(note2.id)]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["added"] == 2

    @pytest.mark.asyncio
    async def test_add_duplicate_notes_idempotent(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test that adding the same note twice doesn't create duplicates."""
        project = await create_project(db, user_id)
        note = await create_note(db, user_id)

        # First assignment
        await async_client.post(
            f"/projects/{project.id}/notes",
            json={"note_ids": [str(note.id)]},
            headers=auth_headers,
        )

        # Second assignment (should be idempotent)
        response = await async_client.post(
            f"/projects/{project.id}/notes",
            json={"note_ids": [str(note.id)]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["added"] == 0

    @pytest.mark.asyncio
    async def test_get_project_notes(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test getting all notes for a project."""
        project = await create_project(db, user_id)
        note = await create_note(db, user_id, title="Assigned Note")

        # Assign note to project
        await async_client.post(
            f"/projects/{project.id}/notes",
            json={"note_ids": [str(note.id)]},
            headers=auth_headers,
        )

        response = await async_client.get(
            f"/projects/{project.id}/notes",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Assigned Note"

    @pytest.mark.asyncio
    async def test_remove_notes_from_project(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test removing notes from a project."""
        project = await create_project(db, user_id)
        note = await create_note(db, user_id)

        # Add then remove
        await async_client.post(
            f"/projects/{project.id}/notes",
            json={"note_ids": [str(note.id)]},
            headers=auth_headers,
        )

        response = await async_client.delete(
            f"/projects/{project.id}/notes",
            json={"note_ids": [str(note.id)]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["removed"] == 1

    @pytest.mark.asyncio
    async def test_project_note_count(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test that project response includes correct note count."""
        project = await create_project(db, user_id)
        note1 = await create_note(db, user_id, title="Note 1")
        note2 = await create_note(db, user_id, title="Note 2")

        await async_client.post(
            f"/projects/{project.id}/notes",
            json={"note_ids": [str(note1.id), str(note2.id)]},
            headers=auth_headers,
        )

        response = await async_client.get(
            f"/projects/{project.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["note_count"] == 2

    @pytest.mark.asyncio
    async def test_delete_project_preserves_notes(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test that deleting a project preserves the notes."""
        project = await create_project(db, user_id)
        note = await create_note(db, user_id, title="Preserved Note")

        await async_client.post(
            f"/projects/{project.id}/notes",
            json={"note_ids": [str(note.id)]},
            headers=auth_headers,
        )

        # Delete project
        await async_client.delete(
            f"/projects/{project.id}",
            headers=auth_headers,
        )

        # Note should still exist
        response = await async_client.get(
            "/notes/",
            headers=auth_headers,
        )
        assert response.status_code == 200
        notes = response.json()
        assert any(n["title"] == "Preserved Note" for n in notes)

    @pytest.mark.asyncio
    async def test_user_isolation(
        self,
        async_client,
        db: AsyncSession,
        user_id: str,
        auth_headers: dict,
    ):
        """Test that users cannot access other users' projects."""
        # Create project for a different user
        other_user_id = str(uuid4())
        project = await create_project(db, other_user_id, name="Other User Project")

        response = await async_client.get(
            f"/projects/{project.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404
