"""Voice notes data access repository."""

from uuid import UUID

from sqlmodel import Session, select

from voice_notes.models.schemas.notes import VoiceNoteUpdate
from voice_notes.models.voice_note import VoiceNote
from voice_notes.services.database import get_session


class NotesRepository:
    """Repository for voice notes data access operations."""

    def __init__(self, session: Session | None = None):
        """Initialize repository with optional session."""
        self.session = session or get_session()

    def get_all(self) -> list[VoiceNote]:
        """Fetch all voice notes from database."""
        return list(self.session.exec(select(VoiceNote)).all())

    def get_by_id(self, note_id: UUID) -> VoiceNote | None:
        """Fetch a single voice note by ID."""
        return self.session.get(VoiceNote, note_id)

    def create(self, note: VoiceNote) -> VoiceNote:
        """Create a new voice note."""
        self.session.add(note)
        self.session.commit()
        self.session.refresh(note)

        return note

    def update(self, note_id: UUID, update_data: VoiceNoteUpdate) -> VoiceNote | None:
        """Update a voice note by ID."""
        note = self.session.get(VoiceNote, note_id)
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
        note = self.session.get(VoiceNote, note_id)
        if not note:
            return False

        self.session.delete(note)
        self.session.commit()

        return True

    def close(self) -> None:
        """Close the session."""
        self.session.close()
