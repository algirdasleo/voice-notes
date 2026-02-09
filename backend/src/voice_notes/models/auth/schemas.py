"""Auth request/response schemas."""

from pydantic import BaseModel


class UpdateMetadataRequest(BaseModel):
    """Request body for updating user metadata."""

    name: str | None = None
