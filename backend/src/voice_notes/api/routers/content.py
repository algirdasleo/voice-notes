"""API content endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.api.dependencies import AccessTokenData, get_access_token_data
from voice_notes.models.content import Content
from voice_notes.models.content.schemas import ContentCreate, ContentUpdate
from voice_notes.repositories.content import ContentRepository
from voice_notes.services.database import get_session

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_content(
    content: ContentCreate,
    session: AsyncSession = Depends(get_session),
    token_data: AccessTokenData = Depends(get_access_token_data),
):
    """Create a new note content."""
    content_repository = ContentRepository(session)
    db_content = Content(**content.model_dump(), user_id=token_data.user_id)
    return await content_repository.create(db_content)


@router.get(f"/{{note_id}}")
async def get_contents(
    note_id: UUID,
    session: AsyncSession = Depends(get_session),
    token_data: AccessTokenData = Depends(get_access_token_data),
):
    """Get all content for a specific note."""
    content_repository = ContentRepository(session)
    content = await content_repository.get_by_note_id(note_id)
    if not content or content[0].user_id != token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    return {"contents": content}


@router.put(f"/{{content_id}}")
async def update_content(
    content_id: UUID,
    content: ContentUpdate,
    session: AsyncSession = Depends(get_session),
    token_data: AccessTokenData = Depends(get_access_token_data),
):
    """Update content by content ID."""
    content_repository = ContentRepository(session)
    db_content = await content_repository.get_by_id(content_id)
    if not db_content or db_content.user_id != token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    return await content_repository.update(content_id, content)


@router.delete(f"/{{content_id}}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: UUID,
    session: AsyncSession = Depends(get_session),
    token_data: AccessTokenData = Depends(get_access_token_data),
):
    """Delete content by ID."""
    content_repository = ContentRepository(session)
    content = await content_repository.get_by_id(content_id)
    if not content or content.user_id != token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    await content_repository.delete(content_id)
