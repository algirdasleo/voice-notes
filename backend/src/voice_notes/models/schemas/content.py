"""Content schemas for request/response handling."""

from uuid import UUID

from pydantic import BaseModel


class ContentCreate(BaseModel):
    """Schema for creating content."""

    note_id: UUID
    title: str
    content_type: str
    body: str


class ContentUpdate(BaseModel):
    """Schema for updating content."""

    title: str | None = None
    content_type: str | None = None
    body: str | None = None
