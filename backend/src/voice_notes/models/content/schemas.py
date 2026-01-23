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


class ContentUpdate(BaseModel):
    """Update content request schema."""

    title: str | None = None
    content_type: str | None = None
    body: str | None = None


class ContentResponse(BaseModel):
    """Content response schema."""

    id: UUID
    note_id: UUID
    user_id: UUID
    title: str
    content_type: str
    body: str
    created_at: date
