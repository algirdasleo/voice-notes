"""Content data access repository."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.models.content import GeneratedContent
from voice_notes.models.content.schemas import ContentUpdate


class ContentRepository:
    """Repository for content data access operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with async session."""
        self.session = session

    async def get_all(self) -> list[GeneratedContent]:
        """Fetch all generated content from database."""
        result = await self.session.execute(select(GeneratedContent))
        return list(result.scalars().all())

    async def get_by_id(self, content_id: UUID) -> GeneratedContent | None:
        """Fetch a single content by ID."""
        return await self.session.get(GeneratedContent, content_id)

    async def get_by_note_id(self, note_id: UUID) -> list[GeneratedContent]:
        """Fetch all content for a specific voice note."""
        result = await self.session.execute(
            select(GeneratedContent).where(GeneratedContent.note_id == note_id)
        )
        return list(result.scalars().all())

    async def create(self, content: GeneratedContent) -> GeneratedContent:
        """Create a new content entry."""
        self.session.add(content)
        await self.session.commit()
        await self.session.refresh(content)

        return content

    async def update(
        self, content_id: UUID, update_data: ContentUpdate
    ) -> GeneratedContent | None:
        """Update content by ID."""
        content = await self.session.get(GeneratedContent, content_id)
        if not content:
            return None

        data = update_data.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(content, key, value)

        await self.session.commit()
        await self.session.refresh(content)

        return content

    async def delete(self, content_id: UUID) -> bool:
        """Delete content by ID."""
        content = await self.session.get(Content, content_id)
        if not content:
            return False

        await self.session.delete(content)
        await self.session.commit()

        return True

    async def close(self) -> None:
        """Close the session."""
        await self.session.close()
