"""Note request/response schemas."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel


class NoteCreate(BaseModel):
    """Create note request schema."""

    title: str
    transcription: str
    tags: list[str] = []


class NoteUpdate(BaseModel):
    """Update note request schema."""

    title: str | None = None
    transcription: str | None = None
    tags: list[str] | None = None


class NoteResponse(BaseModel):
    """Note response schema."""

    id: UUID
    user_id: UUID
    title: str
    transcription: str
    tags: list[str]
    created_at: date
