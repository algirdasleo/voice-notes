"""Model for voice notes."""

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Field, SQLModel


class VoiceNote(SQLModel, table=True, extend_existing=True):
    """Model representing a voice note."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    transcription: str
    tags: list[str] = Field(default_factory=list, sa_type=JSON)
    created_at: date = Field(default_factory=date.today)
