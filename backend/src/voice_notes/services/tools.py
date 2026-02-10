"""Agent tools for the chat agent."""

import logging
from uuid import UUID as PyUUID

from langchain.tools import BaseTool, tool
from langchain_tavily import TavilySearch
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.config.settings import get_settings
from voice_notes.models.notes import Note
from voice_notes.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


def _format_tags(tags: list[str] | None) -> str:
    """Format a list of tags into a comma-separated string."""
    return ", ".join(tags) if tags else "none"


def create_tavily_tool() -> TavilySearch:
    """Create a Tavily web search tool instance.

    Returns:
        A configured TavilySearch tool.
    """
    settings = get_settings()
    return TavilySearch(
        max_results=5,
        tavily_api_key=settings.TAVILY_API_KEY.get_secret_value(),
    )


def create_user_tools(
    user_id: str,
    session: AsyncSession,
    vector_store: VectorStoreService,
    note_ids: list[PyUUID] | None = None,
) -> list[BaseTool]:
    """Create agent tools scoped to a specific user and session."""

    @tool
    async def search_notes(query: str) -> str:
        """Search through voice notes using semantic similarity.

        Use this tool to find relevant information in the user's voice notes.
        Provide a descriptive query about what you're looking for.

        Args:
            query: The search query describing what to find in the notes.

        Returns:
            Relevant note excerpts with titles and similarity scores.
        """
        try:
            results = await vector_store.search_similar(
                query=query,
                user_id=user_id,
                session=session,
                top_k=5,
                note_ids=note_ids,
            )

            if not results:
                return "No relevant notes found for this query."

            formatted = []
            for r in results:
                similarity = 1 - r.distance
                formatted.append(
                    f"**Note: {r.note_title}** "
                    f"(id: {r.note_id}, similarity: {similarity:.2f})\n"
                    f"Excerpt: {r.chunk_text}"
                )
            return "\n\n---\n\n".join(formatted)
        except Exception as e:
            logger.error(f"search_notes failed: {e}", exc_info=True)
            return f"Error searching notes: {str(e)}"

    @tool
    async def list_notes() -> str:
        """List all voice note titles and dates.

        Use this tool to see what notes the user has available.
        Helpful for orienting yourself about the user's notes before searching.

        Returns:
            A formatted list of all note titles, IDs, and creation dates.
        """
        try:
            query_filter = select(
                Note.id, Note.title, Note.created_at, Note.tags
            ).where(Note.user_id == user_id)
            if note_ids:
                query_filter = query_filter.where(Note.id.in_(note_ids))
            result = await session.execute(
                query_filter.order_by(Note.created_at.desc())
            )
            rows = result.fetchall()

            if not rows:
                return "The user has no notes."

            formatted = []
            for row in rows:
                formatted.append(
                    f"- **{row.title}** (id: {row.id}, date: {row.created_at}, tags: {_format_tags(row.tags)})"
                )
            return f"Found {len(rows)} notes:\n" + "\n".join(formatted)
        except Exception as e:
            logger.error(f"list_notes failed: {e}", exc_info=True)
            return f"Error listing notes: {str(e)}"

    @tool
    async def get_note(note_id: str) -> str:
        """Get the full transcription of a specific note by its ID.

        Use this tool when you need the complete content of a note,
        for example when a search excerpt wasn't detailed enough.

        Args:
            note_id: The UUID of the note to retrieve.

        Returns:
            The full note title and transcription.
        """
        try:
            parsed_id = PyUUID(note_id)
            note = await session.get(Note, parsed_id)

            if not note:
                return f"Note with ID {note_id} not found."

            if note.user_id != user_id:
                return f"Note with ID {note_id} not found."

            return (
                f"**{note.title}**\n"
                f"Date: {note.created_at}\n"
                f"Tags: {_format_tags(note.tags)}\n\n"
                f"Transcription:\n{note.transcription}"
            )
        except ValueError:
            return f"Invalid note ID format: {note_id}"
        except Exception as e:
            logger.error(f"get_note failed: {e}", exc_info=True)
            return f"Error retrieving note: {str(e)}"

    return [search_notes, list_notes, get_note, create_tavily_tool()]
