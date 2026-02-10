"""API projects endpoints."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from supertokens_python.recipe.session import SessionContainer

from voice_notes.api.dependencies import get_current_user
from voice_notes.models.projects.db import Project
from voice_notes.models.projects.schemas import (
    ProjectCreate,
    ProjectNoteAction,
    ProjectResponse,
    ProjectUpdate,
)
from voice_notes.repositories.projects import ProjectsRepository
from voice_notes.services.database import get_session
from voice_notes.utils import raise_server_error, verify_ownership

logger = logging.getLogger(__name__)
router = APIRouter()


async def _get_owned_project(
    repo: ProjectsRepository, project_id: UUID, user_id: str
) -> Project:
    """Fetch a project and verify ownership. Raises 404 if not found or not owned."""
    project = await repo.get_by_id(project_id)
    return verify_ownership(project, user_id, "Project")


def _to_response(project: Project, note_count: int = 0) -> ProjectResponse:
    """Convert a Project model + count to a ProjectResponse schema."""
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        name=project.name,
        description=project.description,
        icon=project.icon,
        color=project.color,
        created_at=project.created_at,
        note_count=note_count,
    )


@router.get("/", response_model=list[ProjectResponse])
async def get_projects(
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Get all projects for the current user."""
    try:
        repo = ProjectsRepository(session)
        rows = await repo.get_all(user.user_id)
        return [_to_response(project, count) for project, count in rows]
    except Exception as e:
        raise_server_error(logger, "Failed to get projects", e)


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Create a new project."""
    try:
        repo = ProjectsRepository(session)
        db_project = Project(**project.model_dump(), user_id=user.user_id)
        created = await repo.create(db_project)
        logger.info(f"Project created successfully for user {user.user_id}")
        return _to_response(created, note_count=0)
    except Exception as e:
        raise_server_error(logger, "Failed to create project", e)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Get a single project by ID."""
    try:
        repo = ProjectsRepository(session)
        result = await repo.get_by_id_with_count(project_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )
        project, count = result
        verify_ownership(project, user.user_id, "Project")
        return _to_response(project, count)
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to get project", e)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    update_data: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Update a project by ID."""
    try:
        repo = ProjectsRepository(session)
        await _get_owned_project(repo, project_id, user.user_id)

        updated = await repo.update(project_id, update_data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )
        # Fetch count for response
        result = await repo.get_by_id_with_count(project_id)
        count = result[1] if result else 0
        logger.info(
            f"Project {project_id} updated successfully for user {user.user_id}"
        )
        return _to_response(updated, count)
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to update project", e)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Delete a project by ID. Notes are preserved, only assignments removed."""
    try:
        repo = ProjectsRepository(session)
        await _get_owned_project(repo, project_id, user.user_id)

        await repo.delete(project_id)
        logger.info(
            f"Project {project_id} deleted successfully for user {user.user_id}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to delete project", e)


# ── Note assignment endpoints ──


@router.get("/{project_id}/notes")
async def get_project_notes(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Get all notes assigned to a project."""
    try:
        repo = ProjectsRepository(session)
        await _get_owned_project(repo, project_id, user.user_id)

        notes = await repo.get_notes_for_project(project_id, user.user_id)
        return notes
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to get project notes", e)


@router.post("/{project_id}/notes")
async def add_notes_to_project(
    project_id: UUID,
    body: ProjectNoteAction,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Add notes to a project."""
    try:
        repo = ProjectsRepository(session)
        await _get_owned_project(repo, project_id, user.user_id)

        added = await repo.add_notes(project_id, body.note_ids)
        logger.info(
            f"Added {added} notes to project {project_id} for user {user.user_id}"
        )
        return {"added": added}
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to add notes to project", e)


@router.delete("/{project_id}/notes")
async def remove_notes_from_project(
    project_id: UUID,
    body: ProjectNoteAction,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Remove notes from a project."""
    try:
        repo = ProjectsRepository(session)
        await _get_owned_project(repo, project_id, user.user_id)

        removed = await repo.remove_notes(project_id, body.note_ids)
        logger.info(
            f"Removed {removed} notes from project {project_id} for user {user.user_id}"
        )
        return {"removed": removed}
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to remove notes from project", e)
