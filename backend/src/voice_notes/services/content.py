"""Content generation service using LangChain and OpenAI."""

import logging

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from voice_notes.config.prompts import CONTENT_TYPE_PROMPTS
from voice_notes.config.settings import get_settings

logger = logging.getLogger(__name__)


class ContentGenerationService:
    """Service for generating content from voice note transcriptions."""

    def __init__(self) -> None:
        """Initialize the content generation service."""
        settings = get_settings()
        self.llm = ChatOpenAI(
            model=settings.CHAT_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.7,
        )

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
        system_prompt = CONTENT_TYPE_PROMPTS.get(
            content_type, CONTENT_TYPE_PROMPTS["Custom Prompt"]
        )

        notes_text = "\n\n".join(
            f"--- Note: {t['title']} ---\n{t['text']}" for t in transcriptions
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                (
                    "human",
                    "Here are the voice note transcriptions:\n\n{notes}\n\n"
                    "Generate the {content_type} now.",
                ),
            ]
        )

        chain = prompt | self.llm
        response = await chain.ainvoke(
            {"notes": notes_text, "content_type": content_type}
        )

        body = str(response.content) if hasattr(response, "content") else str(response)

        # Generate a title
        title_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Generate a short, descriptive title (max 8 words) for the following content. "
                    "Return ONLY the title, nothing else.",
                ),
                ("human", "{body}"),
            ]
        )
        title_chain = title_prompt | self.llm
        title_response = await title_chain.ainvoke({"body": body})
        title = str(
            title_response.content
            if hasattr(title_response, "content")
            else title_response
        )

        return {"title": title.strip().strip('"'), "body": body}
