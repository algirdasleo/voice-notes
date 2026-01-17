"""API notes endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_notes():
    """Get all voice notes."""
    return {"notes": ["Note 1", "Note 2"]}
