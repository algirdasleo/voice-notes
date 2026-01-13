"""Voice note schemas for request/response handling."""

from pydantic import BaseModel


class VoiceNoteUpdate(BaseModel):
    """Schema for updating voice notes."""

    title: str | None = None
    transcription: str | None = None
    tags: list[str] | None = None
