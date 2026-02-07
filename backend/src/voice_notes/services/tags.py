"""Tag suggestion service using OpenAI Responses API."""

import logging

from openai import AsyncOpenAI

from voice_notes.config.prompts import TAG_SUGGESTION_SYSTEM_PROMPT
from voice_notes.config.settings import get_settings
from voice_notes.models.tags.schemas import SuggestedTags

logger = logging.getLogger(__name__)

settings = get_settings()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())


async def suggest_tags_from_text(text: str) -> list[str]:
    """Generate 4 suggested tags for the given transcription text."""
    try:
        response = await client.responses.parse(
            model=settings.CHAT_MODEL,
            instructions=TAG_SUGGESTION_SYSTEM_PROMPT,
            input=text,
            text_format=SuggestedTags,
        )

        result = response.output_parsed
        if result:
            return [tag.strip().lower() for tag in result.tags[:4]]

        return []
    except Exception as e:
        logger.error(f"Failed to suggest tags: {e}")
        return []
