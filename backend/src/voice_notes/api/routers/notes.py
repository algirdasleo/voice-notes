"""API notes endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from voice_notes.api.dependencies import get_current_user_id
from voice_notes.models.note import Note
from voice_notes.models.schemas.notes import NoteCreate, NoteUpdate
from voice_notes.repositories.notes import NotesRepository
from voice_notes.services.database import get_session

router = APIRouter()


@router.post("/")
def create_note(
    note: NoteCreate,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Create a new voice note."""
    notes_repository = NotesRepository(session)
    db_note = Note(**note.model_dump(), user_id=user_id)
    return notes_repository.create(db_note)


@router.get("/")
def get_notes(
    session: Session = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Get all voice notes."""
    notes_repository = NotesRepository(session)
    return {"notes": notes_repository.get_notes(user_id)}


@router.put(f"/{{note_id}}")
def update_note(
    note_id: UUID,
    note: NoteUpdate,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Update a voice note by ID."""
    notes_repository = NotesRepository(session)
    db_note = notes_repository.get_by_note_id(note_id)
    if not db_note or db_note.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    return notes_repository.update(note_id, note)


@router.delete(f"/{{note_id}}")
def delete_note(
    note_id: UUID,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Delete a voice note by ID."""
    notes_repository = NotesRepository(session)
    db_note = notes_repository.get_by_note_id(note_id)
    if not db_note or db_note.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    notes_repository.delete(note_id)
    return {"detail": "Note deleted successfully"}