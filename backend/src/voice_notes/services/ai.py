"""AI Service for chat operations."""

from uuid import UUID


class AIService:
    """Service for handling AI chat operations."""

    async def process_message(self, user_id: UUID, content: str) -> str:
        """Process a user message and return AI response.

        Returns:
            The AI response text
        """
        # TODO: Implement with llm_client, vector_db, and langraph
        return content
