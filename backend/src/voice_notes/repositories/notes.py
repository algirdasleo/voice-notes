"""Voice notes data access repository."""

from uuid import UUID

from sqlmodel import Session, select

from voice_notes.models.note import Note
from voice_notes.models.schemas.notes import VoiceNoteUpdate


class NotesRepository:
    """Repository for voice notes data access operations."""

    def __init__(self, session: Session):
        """Initialize repository with optional session."""
        self.session = session

    def get_all(self) -> list[Note]:
        """Fetch all voice notes from database."""
        return list(self.session.exec(select(Note)).all())

    def get_by_id(self, note_id: UUID) -> Note | None:
        """Fetch a single voice note by ID."""
        return self.session.get(Note, note_id)

    def create(self, note: Note) -> Note:
        """Create a new voice note."""
        self.session.add(note)
        self.session.commit()
        self.session.refresh(note)

        return note

    def update(self, note_id: UUID, update_data: VoiceNoteUpdate) -> Note | None:
        """Update a voice note by ID."""
        note = self.session.get(Note, note_id)
        if not note:
            return None

        data = update_data.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(note, key, value)

        self.session.add(note)
        self.session.commit()
        self.session.refresh(note)

        return note

    def delete(self, note_id: UUID) -> bool:
        """Delete a voice note by ID."""
        note = self.session.get(Note, note_id)
        if not note:
            return False

        self.session.delete(note)
        self.session.commit()

        return True

    def close(self) -> None:
        """Close the session."""
        self.session.close()
