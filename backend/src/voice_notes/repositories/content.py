"""Content data access repository."""

from uuid import UUID

from sqlmodel import Session, select

from voice_notes.models.content import Content
from voice_notes.models.schemas.content import ContentUpdate


class ContentRepository:
    """Repository for content data access operations."""

    def __init__(self, session: Session):
        """Initialize repository with optional session."""
        self.session = session

    def get_all(self) -> list[Content]:
        """Fetch all generated content from database."""
        return list(self.session.exec(select(Content)).all())

    def get_by_id(self, content_id: UUID) -> Content | None:
        """Fetch a single content by ID."""
        return self.session.get(Content, content_id)

    def get_by_note_id(self, note_id: UUID) -> list[Content]:
        """Fetch all content for a specific voice note."""
        return list(
            self.session.exec(select(Content).where(Content.note_id == note_id)).all()
        )

    def create(self, content: Content) -> Content:
        """Create a new content entry."""
        self.session.add(content)
        self.session.commit()
        self.session.refresh(content)

        return content

    def update(self, content_id: UUID, update_data: ContentUpdate) -> Content | None:
        """Update content by ID."""
        content = self.session.get(Content, content_id)
        if not content:
            return None

        data = update_data.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(content, key, value)

        self.session.add(content)
        self.session.commit()
        self.session.refresh(content)

        return content

    def delete(self, content_id: UUID) -> bool:
        """Delete content by ID."""
        content = self.session.get(Content, content_id)
        if not content:
            return False

        self.session.delete(content)
        self.session.commit()

        return True

    def close(self) -> None:
        """Close the session."""
        self.session.close()
