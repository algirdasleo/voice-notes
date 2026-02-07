"""API content endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
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

router = APIRouter()


@router.get("/types")
async def get_content_types() -> list[str]:
    """Get available content types."""
    return CONTENT_TYPES


@router.get("/")
async def get_all_content(
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
) -> list[ContentWithNoteResponse]:
    """Get all content for the current user with note details."""
    content_repository = ContentRepository(session)
    content_list = await content_repository.get_all_with_notes(user.user_id)

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


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_content(
    request: ContentGenerateRequest,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Generate content from selected voice notes using AI."""
    if not request.note_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one note must be selected.",
        )

    if request.content_type not in CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type. Must be one of: {CONTENT_TYPES}",
        )

    notes_repo = NotesRepository(session)
    transcriptions: list[dict[str, str]] = []
    primary_note_id = request.note_ids[0]

    for note_id in request.note_ids:
        note = await notes_repo.get_by_note_id(note_id)
        if not note or note.user_id != user.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Note {note_id} not found.",
            )
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
    return saved


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_content(
    content: ContentCreate,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Create a new note content."""
    content_repository = ContentRepository(session)
    db_content = GeneratedContent(**content.model_dump(), user_id=user.user_id)
    return await content_repository.create(db_content)


@router.get(f"/{{note_id}}")
async def get_contents(
    note_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Get all content for a specific note."""
    content_repository = ContentRepository(session)
    content = await content_repository.get_by_note_id(note_id)
    if not content or content[0].user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    return content


@router.put(f"/{{content_id}}")
async def update_content(
    content_id: UUID,
    content: ContentUpdate,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Update content by content ID."""
    content_repository = ContentRepository(session)
    db_content = await content_repository.get_by_id(content_id)
    if not db_content or db_content.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    return await content_repository.update(content_id, content)


@router.delete(f"/{{content_id}}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Delete content by ID."""
    content_repository = ContentRepository(session)
    content = await content_repository.get_by_id(content_id)
    if not content or content.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    await content_repository.delete(content_id)
