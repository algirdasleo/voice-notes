"""Note embedding domain models."""

from voice_notes.models.embeddings.db import NoteEmbedding
from voice_notes.models.embeddings.schemas import SimilarChunk

__all__ = ["NoteEmbedding", "SimilarChunk"]
