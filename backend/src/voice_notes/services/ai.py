"""AI Service for chat operations."""

from uuid import UUID


class AIService:
    """Service for handling AI chat operations."""

    async def talk_with_notes(self, user_id: UUID, content: str) -> str:
        """Process a user message and return AI response."""
        ...
