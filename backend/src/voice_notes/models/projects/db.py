"""Project database models."""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from voice_notes.models.shared import Base


class Project(Base):
    """Model representing a project that groups voice notes."""

    __tablename__ = "project"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[str]
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String, default="")
    icon: Mapped[str] = mapped_column(String, default="Folder")
    color: Mapped[str] = mapped_column(String, default="blue")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class NoteProject(Base):
    """Junction model for many-to-many relationship between notes and projects."""

    __tablename__ = "note_project"

    note_id: Mapped[UUID] = mapped_column(
        ForeignKey("note.id", ondelete="CASCADE"), primary_key=True
    )
    project_id: Mapped[UUID] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE"), primary_key=True
    )
