"""AI Service for chat operations using a LangChain agent."""

import logging
from collections.abc import AsyncGenerator

from langchain.agents import create_agent
from langchain.messages import AIMessageChunk
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.config.prompts.chat import CHAT_SYSTEM_PROMPT
from voice_notes.config.settings import get_settings
from voice_notes.services.tools import create_user_tools
from voice_notes.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


class ChatService:
    """Service for handling AI chat operations with a tool-using agent."""

    def __init__(self, vector_store: VectorStoreService):
        """Initialize chat service with LLM and vector store."""
        settings = get_settings()
        self.llm = ChatOpenAI(
            model=settings.CHAT_MODEL,
            api_key=settings.OPENAI_API_KEY,
            streaming=True,
        )
        self.vector_store = vector_store
        self.system_prompt = CHAT_SYSTEM_PROMPT

    def _create_agent(
        self,
        user_id: str,
        session: AsyncSession,
        note_ids: list | None = None,
    ):
        """Create a react agent with user-scoped tools."""
        tools = create_user_tools(
            user_id=user_id,
            session=session,
            vector_store=self.vector_store,
            note_ids=note_ids,
        )
        return create_agent(
            model=self.llm,
            tools=tools,
            system_prompt=self.system_prompt,
        )

    async def stream_response(
        self,
        user_id: str,
        messages: list,
        session: AsyncSession,
        note_ids: list | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream agent response tokens for the given message history.

        Yields:
            Individual text tokens from the agent's response.
        """
        agent = self._create_agent(user_id, session, note_ids=note_ids)

        async for chunk, _ in agent.astream(
            {"messages": messages},
            stream_mode="messages",
        ):
            if isinstance(chunk, AIMessageChunk) and chunk.text:
                yield chunk.text
