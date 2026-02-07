"""API notes endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from supertokens_python.recipe.session import SessionContainer

from voice_notes.api.dependencies import get_current_user
from voice_notes.models.notes import Note
from voice_notes.models.notes.schemas import (
    NoteCreate,
    NoteUpdate,
    SuggestTagsRequest,
    SuggestTagsResponse,
)
from voice_notes.repositories.notes import NotesRepository
from voice_notes.services.database import get_session
from voice_notes.services.tags import suggest_tags_from_text

router = APIRouter()


@router.post("/")
async def create_note(
    note: NoteCreate,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Create a new voice note."""
    try:
        notes_repository = NotesRepository(session)
        db_note = Note(**note.model_dump(), user_id=user.user_id)
        return await notes_repository.create(db_note)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}",
        )


@router.post("/suggest-tags", response_model=SuggestTagsResponse)
async def suggest_tags(
    request: SuggestTagsRequest,
    user: SessionContainer = Depends(get_current_user),
):
    """Suggest tags for a given transcription text."""
    try:
        tags = await suggest_tags_from_text(request.text)
        return SuggestTagsResponse(tags=tags)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to suggest tags: {str(e)}",
        )


@router.get("/")
async def get_notes(
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Get all voice notes."""
    try:
        notes_repository = NotesRepository(session)
        return await notes_repository.get_notes(user.user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get notes: {str(e)}",
        )


@router.put(f"/{{note_id}}")
async def update_note(
    note_id: UUID,
    note: NoteUpdate,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Update a voice note by ID."""
    try:
        notes_repository = NotesRepository(session)
        db_note = await notes_repository.get_by_note_id(note_id)
        if not db_note or db_note.user_id != user.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
            )

        return await notes_repository.update(note_id, note)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note: {str(e)}",
        )


@router.delete(f"/{{note_id}}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: SessionContainer = Depends(get_current_user),
):
    """Delete a voice note by ID."""
    try:
        notes_repository = NotesRepository(session)
        db_note = await notes_repository.get_by_note_id(note_id)
        if not db_note or db_note.user_id != user.user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
            )

        await notes_repository.delete(note_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}",
        )
