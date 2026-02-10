"""Vector store service for embedding and similarity search using pgvector."""

import logging
from uuid import UUID

from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import AsyncOpenAI
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.config.settings import get_settings
from voice_notes.models.embeddings import NoteEmbedding, SimilarChunk
from voice_notes.models.notes import Note

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service for managing note embeddings and similarity search."""

    def __init__(self):
        """Initialize the vector store service with OpenAI client."""
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())
        self.model = settings.EMBEDDING_MODEL
        self.dimensions = settings.EMBEDDING_DIMENSIONS

    @staticmethod
    def chunk_text(content: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
        """Split text into overlapping chunks using RecursiveCharacterTextSplitter."""
        if not content or not content.strip():
            return []

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
        )
        return splitter.split_text(content.strip())

    async def get_embedding(self, content: str) -> list[float]:
        """Generate an embedding vector for the given text."""
        response = await self.client.embeddings.create(
            model=self.model,
            input=content,
            dimensions=self.dimensions,
        )
        return response.data[0].embedding

    async def embed_note(self, note: Note, session: AsyncSession) -> None:
        """Generate embeddings for a note's transcription and store them."""
        note_id = note.id
        user_id = note.user_id
        transcription = note.transcription

        chunks = self.chunk_text(transcription)
        if not chunks:
            logger.warning(f"No chunks generated for note {note_id}")
            return

        logger.info(f"Embedding note {note_id} ({len(chunks)} chunks)")

        for i, chunk in enumerate(chunks):
            embedding = await self.get_embedding(chunk)
            note_embedding = NoteEmbedding(
                note_id=note_id,
                user_id=user_id,
                chunk_text=chunk,
                chunk_index=i,
                embedding=embedding,
            )
            session.add(note_embedding)

        await session.commit()
        logger.info(f"Successfully embedded note {note_id}")

    async def delete_note_embeddings(
        self, note_id: UUID, session: AsyncSession
    ) -> None:
        """Delete all embeddings for a given note."""
        await session.execute(
            delete(NoteEmbedding).where(NoteEmbedding.note_id == note_id)
        )
        await session.commit()
        logger.info(f"Deleted embeddings for note {note_id}")

    async def search_similar(
        self,
        query: str,
        user_id: str,
        session: AsyncSession,
        top_k: int = 5,
        note_ids: list[UUID] | None = None,
    ) -> list[SimilarChunk]:
        """Search for note chunks most similar to the query.

        Args:
            query: The search query.
            user_id: The user ID to scope results.
            session: The database session.
            top_k: Number of results to return.
            note_ids: Optional list of note IDs to restrict search to.
        """
        query_embedding = await self.get_embedding(query)

        # Build WHERE clause dynamically based on note_ids filter
        note_filter = "AND ne.note_id = ANY(:note_ids)" if note_ids else ""
        sql = text(f"""
            SELECT
                ne.note_id,
                ne.chunk_text,
                ne.chunk_index,
                n.title as note_title,
                ne.embedding <=> :embedding AS distance
            FROM note_embedding ne
            JOIN note n ON n.id = ne.note_id
            WHERE ne.user_id = :user_id
              {note_filter}
            ORDER BY distance ASC
            LIMIT :top_k
        """)
        params: dict = {
            "embedding": str(query_embedding),
            "user_id": user_id,
            "top_k": top_k,
        }
        if note_ids:
            params["note_ids"] = [str(nid) for nid in note_ids]

        result = await session.execute(sql, params)

        rows = result.fetchall()
        return [
            SimilarChunk(
                note_id=str(row.note_id),
                note_title=row.note_title,
                chunk_text=row.chunk_text,
                chunk_index=row.chunk_index,
                distance=float(row.distance),
            )
            for row in rows
        ]

    async def has_embeddings(self, note_id: UUID, session: AsyncSession) -> bool:
        """Check if a note already has embeddings."""
        result = await session.execute(
            select(NoteEmbedding.id).where(NoteEmbedding.note_id == note_id).limit(1)
        )
        return result.scalar() is not None
