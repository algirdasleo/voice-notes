"""Note embedding database model for pgvector storage."""

from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from voice_notes.config.settings import get_settings
from voice_notes.models.shared import Base

_EMBEDDING_DIMENSIONS = get_settings().EMBEDDING_DIMENSIONS


class NoteEmbedding(Base):
    """Model representing a vector embedding chunk for a note."""

    __tablename__ = "note_embedding"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    note_id: Mapped[UUID] = mapped_column(
        ForeignKey("note.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(String, index=True)
    chunk_text: Mapped[str] = mapped_column(String)
    chunk_index: Mapped[int]
    embedding: Mapped[list[float]] = mapped_column(Vector(_EMBEDDING_DIMENSIONS))

    __table_args__ = (
        Index(
            "ix_note_embedding_cosine",
            embedding,
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )
