"""API notes endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlmodel import Session

from voice_notes.api.dependencies import get_current_user_id
from voice_notes.repositories.notes import NotesRepository
from voice_notes.services.database import get_session

router = APIRouter()


@router.get("/")
def get_notes(
    session: Session = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Get all voice notes."""
    notes_repository = NotesRepository(session)
    return {"notes": notes_repository.get_notes(user_id)}
