"""API notes endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.api.dependencies import get_access_token_data
from voice_notes.models.auth import AccessTokenData
from voice_notes.models.notes import Note
from voice_notes.models.notes.schemas import NoteCreate, NoteUpdate
from voice_notes.repositories.notes import NotesRepository
from voice_notes.services.database import get_session

router = APIRouter()


@router.post("/")
async def create_note(
    note: NoteCreate,
    session: AsyncSession = Depends(get_session),
    token_data: AccessTokenData = Depends(get_access_token_data),
):
    """Create a new voice note."""
    notes_repository = NotesRepository(session)
    db_note = Note(**note.model_dump(), user_id=token_data.user_id)
    return await notes_repository.create(db_note)


@router.get("/")
async def get_notes(
    session: AsyncSession = Depends(get_session),
    token_data: AccessTokenData = Depends(get_access_token_data),
):
    """Get all voice notes."""
    notes_repository = NotesRepository(session)
    return {"notes": await notes_repository.get_notes(token_data.user_id)}


@router.put(f"/{{note_id}}")
async def update_note(
    note_id: UUID,
    note: NoteUpdate,
    session: AsyncSession = Depends(get_session),
    token_data: AccessTokenData = Depends(get_access_token_data),
):
    """Update a voice note by ID."""
    notes_repository = NotesRepository(session)
    db_note = await notes_repository.get_by_note_id(note_id)
    if not db_note or db_note.user_id != token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    return await notes_repository.update(note_id, note)


@router.delete(f"/{{note_id}}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    session: AsyncSession = Depends(get_session),
    token_data: AccessTokenData = Depends(get_access_token_data),
):
    """Delete a voice note by ID."""
    notes_repository = NotesRepository(session)
    db_note = await notes_repository.get_by_note_id(note_id)
    if not db_note or db_note.user_id != token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    await notes_repository.delete(note_id)
