"""Project request/response schemas."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    """Create project request schema."""

    name: str
    description: str = ""
    icon: str = "Folder"
    color: str = "blue"


class ProjectUpdate(BaseModel):
    """Update project request schema."""

    name: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None


class ProjectResponse(BaseModel):
    """Project response schema."""

    id: UUID
    user_id: str
    name: str
    description: str
    icon: str
    color: str
    created_at: date
    note_count: int = 0


class ProjectNoteAction(BaseModel):
    """Schema for adding/removing notes from a project."""

    note_ids: list[UUID]
