"""API content endpoints."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from supertokens_python.recipe.session import SessionContainer

from voice_notes.api.dependencies import get_current_user
from voice_notes.models.content import GeneratedContent
from voice_notes.models.content.db import CONTENT_TYPES
from voice_notes.models.content.schemas import (
    ContentCreate,
    ContentGenerateRequest,
    ContentUpdate,
    ContentWithNoteResponse,
    NoteInfo,
)
from voice_notes.repositories.content import ContentRepository
from voice_notes.repositories.notes import NotesRepository
from voice_notes.services.content import ContentGenerationService
from voice_notes.services.database import get_session
from voice_notes.utils import raise_server_error, verify_ownership

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/types")
async def get_content_types() -> list[str]:
    """Get available content types."""
    try:
        logger.info("Content types retrieved")
        return CONTENT_TYPES
    except Exception as e:
        raise_server_error(logger, "Failed to get content types", e)


@router.get("/")
async def get_all_content(
    content_type: str | None = Query(None, description="Filter content by type"),
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
) -> list[ContentWithNoteResponse]:
    """Get all content for the current user with note details, optionally filtered by content type."""
    try:
        content_repository = ContentRepository(session)
        content_list = await content_repository.get_all_with_notes(
            user.user_id, content_type=content_type
        )

        logger.info(f"All content retrieved successfully for user {user.user_id}")
        return [
            ContentWithNoteResponse(
                id=content.id,
                title=content.title,
                content_type=content.content_type,
                body=content.body,
                created_at=content.created_at,
                note=NoteInfo(
                    id=note_id,
                    title=note_title,
                    transcription=note_transcription,
                ),
            )
            for content, note_id, note_title, note_transcription in content_list
        ]
    except Exception as e:
        raise_server_error(logger, "Failed to get content", e)


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_content(
    request: ContentGenerateRequest,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Generate content from selected voice notes using AI."""
    try:
        if not request.note_ids:
            logger.warning(
                f"Content generation request with no notes for user {user.user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one note must be selected.",
            )

        if request.content_type not in CONTENT_TYPES:
            logger.warning(
                f"Invalid content type '{request.content_type}' for user {user.user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content type. Must be one of: {CONTENT_TYPES}",
            )

        notes_repo = NotesRepository(session)
        transcriptions: list[dict[str, str]] = []
        primary_note_id = request.note_ids[0]

        for note_id in request.note_ids:
            note = await notes_repo.get_by_note_id(note_id)
            note = verify_ownership(note, user.user_id, f"Note {note_id}")
            transcriptions.append({"title": note.title, "text": note.transcription})

        service = ContentGenerationService()
        result = await service.generate(transcriptions, request.content_type)

        content_repo = ContentRepository(session)
        db_content = GeneratedContent(
            note_id=primary_note_id,
            user_id=user.user_id,
            title=result["title"],
            content_type=request.content_type,
            body=result["body"],
        )
        saved = await content_repo.create(db_content)
        logger.info(f"Content generated successfully for user {user.user_id}")
        return saved
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to generate content", e)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_content(
    content: ContentCreate,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Create a new note content."""
    try:
        content_repository = ContentRepository(session)
        db_content = GeneratedContent(**content.model_dump(), user_id=user.user_id)
        created = await content_repository.create(db_content)
        logger.info(f"Content created successfully for user {user.user_id}")
        return created
    except Exception as e:
        raise_server_error(logger, "Failed to create content", e)


@router.get(f"/{{note_id}}")
async def get_contents(
    note_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Get all content for a specific note."""
    try:
        content_repository = ContentRepository(session)
        content = await content_repository.get_by_note_id(note_id)
        if not content or content[0].user_id != user.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
            )

        logger.info(f"Content retrieved for note {note_id} by user {user.user_id}")
        return content
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to get content", e)


@router.put(f"/{{content_id}}")
async def update_content(
    content_id: UUID,
    content: ContentUpdate,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Update content by content ID."""
    try:
        content_repository = ContentRepository(session)
        db_content = await content_repository.get_by_id(content_id)
        verify_ownership(db_content, user.user_id, "Content")

        updated = await content_repository.update(content_id, content)
        logger.info(
            f"Content {content_id} updated successfully for user {user.user_id}"
        )
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to update content", e)


@router.delete(f"/{{content_id}}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Delete content by ID."""
    try:
        content_repository = ContentRepository(session)
        content = await content_repository.get_by_id(content_id)
        verify_ownership(content, user.user_id, "Content")

        await content_repository.delete(content_id)
        logger.info(
            f"Content {content_id} deleted successfully for user {user.user_id}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise_server_error(logger, "Failed to delete content", e)
