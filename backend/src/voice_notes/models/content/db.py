"""Content database model."""

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from voice_notes.models.shared import Base

CONTENT_TYPES = [
    "Meeting Report",
    "To-Do List",
    "Translate",
    "Blog Post",
    "Email",
    "Summary",
    "Custom Prompt",
]


class Content(Base):
    """Model representing generated content from a voice note."""

    __tablename__ = "content"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    note_id: Mapped[UUID] = mapped_column(ForeignKey("note.id"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    title: Mapped[str] = mapped_column(String)
    content_type: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(String)
    created_at: Mapped[date] = mapped_column(default=date.today)
