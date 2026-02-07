"""Tag schemas."""

from pydantic import BaseModel


class SuggestedTags(BaseModel):
    """Structured output model for tag suggestions."""

    tags: list[str]
