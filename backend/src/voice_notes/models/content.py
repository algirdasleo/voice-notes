"""Model for created content."""

from datetime import date
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

CONTENT_TYPES = [
    "Meeting Report",
    "To-Do List",
    "Translate",
    "Blog Post",
    "Email",
    "Summary",
    "Custom Prompt",
]


class Content(SQLModel, table=True):
    """Model representing generated content from a voice note."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    note_id: UUID = Field(foreign_key="Note.id")
    title: str
    content_type: str = Field(min_length=1)
    body: str
    created_at: date = Field(default_factory=date.today)
