"""Chat request/response schemas."""

from typing import Literal

from pydantic import BaseModel, Field


class WebSocketUser(BaseModel):
    """Lightweight user object for WebSocket connections."""

    user_id: str


class AIChatRequest(BaseModel):
    """Schema for WebSocket chat messages."""

    type: Literal["message", "close"]
    content: str | None = Field(
        default=None, description="Content is required for 'message' type"
    )
