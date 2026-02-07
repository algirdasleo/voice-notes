"""Content request/response schemas."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel


class ContentCreate(BaseModel):
    """Create content request schema."""

    note_id: UUID
    title: str
    content_type: str
    body: str


class ContentGenerateRequest(BaseModel):
    """Request schema for generating content from voice notes."""

    note_ids: list[UUID]
    content_type: str


class ContentUpdate(BaseModel):
    """Update content request schema."""

    title: str | None = None
    content_type: str | None = None
    body: str | None = None


class ContentResponse(BaseModel):
    """Content response schema."""

    id: UUID
    note_id: UUID
    user_id: str
    title: str
    content_type: str
    body: str
    created_at: date


class NoteInfo(BaseModel):
    """Note information for content response."""

    id: UUID
    title: str
    transcription: str


class ContentWithNoteResponse(BaseModel):
    """Content response with note details."""

    id: UUID
    title: str
    content_type: str
    body: str
    created_at: date
    note: NoteInfo
