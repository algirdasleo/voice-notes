"""API content endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from voice_notes.api.dependencies import get_current_user_id
from voice_notes.models.content import Content
from voice_notes.models.schemas.content import ContentCreate, ContentUpdate
from voice_notes.repositories.content import ContentRepository
from voice_notes.services.database import get_session

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_content(
    content: ContentCreate,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Create a new note content."""
    content_repository = ContentRepository(session)
    db_content = Content(**content.model_dump(), user_id=user_id)
    return content_repository.create(db_content)


@router.get(f"/{{note_id}}")
def get_contents(
    note_id: UUID,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Get all content for a specific note."""
    content_repository = ContentRepository(session)
    content = content_repository.get_by_note_id(note_id)
    if not content or content[0].user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    return {"content": content}


@router.put(f"/{{content_id}}")
def update_content(
    content_id: UUID,
    content: ContentUpdate,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Update content by content ID."""
    content_repository = ContentRepository(session)
    db_content = content_repository.get_by_id(content_id)
    if not db_content or db_content.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    return content_repository.update(content_id, content)


@router.delete(f"/{{content_id}}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    content_id: UUID,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """Delete content by ID."""
    content_repository = ContentRepository(session)
    content = content_repository.get_by_id(content_id)
    if not content or content.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    content_repository.delete(content_id)
