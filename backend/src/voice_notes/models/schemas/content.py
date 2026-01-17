"""Content schemas for request/response handling."""

from pydantic import BaseModel


class ContentUpdate(BaseModel):
    """Schema for updating content."""

    title: str | None = None
    content_type: str | None = None
    body: str | None = None
