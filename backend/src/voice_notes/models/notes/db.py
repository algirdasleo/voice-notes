"""Note database model."""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from voice_notes.models.shared import Base


class Note(Base):
    """Model representing a note."""

    __tablename__ = "note"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[str]
    title: Mapped[str] = mapped_column(String)
    transcription: Mapped[str] = mapped_column(String)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
