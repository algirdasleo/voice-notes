"""Embedding response schemas."""

from pydantic import BaseModel


class SimilarChunk(BaseModel):
    """A note chunk returned from a similarity search."""

    note_id: str
    note_title: str
    chunk_text: str
    chunk_index: int
    distance: float
