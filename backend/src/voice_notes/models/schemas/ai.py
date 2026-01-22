"""Schemas for AI interactions."""

from typing import Literal

from pydantic import BaseModel


class AIChatRequest(BaseModel):
    """Schema for WebSocket chat messages."""

    type: Literal["message", "close"]
    content: str
