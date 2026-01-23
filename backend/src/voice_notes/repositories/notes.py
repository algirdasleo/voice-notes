"""Voice notes data access repository."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.models.notes import Note
from voice_notes.models.notes.schemas import NoteUpdate


class NotesRepository:
    """Repository for voice notes data access operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with async session."""
        self.session = session

    async def get_notes(self, user_id: UUID) -> list[Note]:
        """Fetch all voice notes from database."""
        result = await self.session.execute(select(Note).where(Note.user_id == user_id))
        return list(result.scalars().all())

    async def get_by_note_id(self, note_id: UUID) -> Note | None:
        """Fetch a single voice note by ID."""
        return await self.session.get(Note, note_id)

    async def create(self, note: Note) -> Note:
        """Create a new voice note."""
        self.session.add(note)
        await self.session.commit()
        await self.session.refresh(note)

        return note

    async def update(self, note_id: UUID, update_data: NoteUpdate) -> Note | None:
        """Update a voice note by ID."""
        note = await self.session.get(Note, note_id)
        if not note:
            return None

        data = update_data.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(note, key, value)

        await self.session.commit()
        await self.session.refresh(note)

        return note

    async def delete(self, note_id: UUID) -> bool:
        """Delete a voice note by ID."""
        note = await self.session.get(Note, note_id)
        if not note:
            return False

        await self.session.delete(note)
        await self.session.commit()

        return True

    async def close(self) -> None:
        """Close the session."""
        await self.session.close()
