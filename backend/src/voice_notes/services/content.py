"""Content generation service using OpenAI Responses API."""

import logging

from openai import AsyncOpenAI

from voice_notes.config.prompts import CONTENT_TYPE_PROMPTS
from voice_notes.config.settings import get_settings
from voice_notes.models.content.schemas import GeneratedContentResponse

logger = logging.getLogger(__name__)


class ContentGenerationService:
    """Service for generating content from voice note transcriptions."""

    def __init__(self) -> None:
        """Initialize the content generation service."""
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())
        self.model = settings.CHAT_MODEL

    async def generate(
        self,
        transcriptions: list[dict[str, str]],
        content_type: str,
    ) -> dict[str, str]:
        """Generate content from transcriptions.

        Args:
            transcriptions: List of dicts with 'title' and 'text' keys.
            content_type: The type of content to generate.

        Returns:
            Dict with 'title' and 'body' of the generated content.
        """
        base_prompt = CONTENT_TYPE_PROMPTS.get(
            content_type, CONTENT_TYPE_PROMPTS["Custom Prompt"]
        )

        system_prompt = (
            f"{base_prompt}\n\n"
            "Return a JSON object with a short descriptive title (max 8 words) "
            "and the full generated content body in markdown format."
        )

        notes_text = "\n\n".join(
            f"--- Note: {t['title']} ---\n{t['text']}" for t in transcriptions
        )

        user_input = (
            f"Here are the voice note transcriptions:\n\n{notes_text}\n\n"
            f"Generate the {content_type} now."
        )

        try:
            response = await self.client.responses.parse(
                model=self.model,
                instructions=system_prompt,
                input=user_input,
                text_format=GeneratedContentResponse,
            )

            result = response.output_parsed
            if result:
                return {
                    "title": result.title.strip().strip('"'),
                    "body": result.body,
                }

            return {"title": content_type, "body": ""}
        except Exception as e:
            logger.error(f"Failed to generate content: {e}")
            return {"title": content_type, "body": ""}
