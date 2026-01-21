"""Voice note schemas for request/response handling."""

from pydantic import BaseModel


class NoteCreate(BaseModel):
    """Schema for creating voice notes."""

    title: str
    transcription: str
    tags: list[str] | None = None


class NoteUpdate(BaseModel):
    """Schema for updating voice notes."""

    title: str | None = None
    transcription: str | None = None
    tags: list[str] | None = None
