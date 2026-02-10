"""Projects data access repository."""

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.models.notes import Note
from voice_notes.models.projects.db import NoteProject, Project
from voice_notes.models.projects.schemas import ProjectUpdate


class ProjectsRepository:
    """Repository for projects data access operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with async session."""
        self.session = session

    async def get_all(self, user_id: str) -> list[tuple[Project, int]]:
        """Fetch all projects for a user with note counts."""
        query = (
            select(Project, func.count(NoteProject.note_id).label("note_count"))
            .outerjoin(NoteProject, Project.id == NoteProject.project_id)
            .where(Project.user_id == user_id)
            .group_by(Project.id)
            .order_by(Project.created_at.desc())
        )
        result = await self.session.execute(query)
        return [(row[0], row[1]) for row in result.all()]

    async def get_by_id(self, project_id: UUID) -> Project | None:
        """Fetch a single project by ID."""
        return await self.session.get(Project, project_id)

    async def get_by_id_with_count(
        self, project_id: UUID
    ) -> tuple[Project, int] | None:
        """Fetch a single project by ID with note count."""
        query = (
            select(Project, func.count(NoteProject.note_id).label("note_count"))
            .outerjoin(NoteProject, Project.id == NoteProject.project_id)
            .where(Project.id == project_id)
            .group_by(Project.id)
        )
        result = await self.session.execute(query)
        row = result.first()
        if not row:
            return None
        return (row[0], row[1])

    async def create(self, project: Project) -> Project:
        """Create a new project."""
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def update(
        self, project_id: UUID, update_data: ProjectUpdate
    ) -> Project | None:
        """Update a project by ID."""
        project = await self.session.get(Project, project_id)
        if not project:
            return None

        data = update_data.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(project, key, value)

        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def delete(self, project_id: UUID) -> bool:
        """Delete a project by ID. Junction table entries cascade."""
        project = await self.session.get(Project, project_id)
        if not project:
            return False

        await self.session.delete(project)
        await self.session.commit()
        return True

    # ── Note-Project assignment methods ──

    async def add_notes(self, project_id: UUID, note_ids: list[UUID]) -> int:
        """Add notes to a project. Returns number of new assignments created."""
        added = 0
        for note_id in note_ids:
            # Check if already assigned
            existing = await self.session.get(NoteProject, (note_id, project_id))
            if not existing:
                self.session.add(NoteProject(note_id=note_id, project_id=project_id))
                added += 1
        await self.session.commit()
        return added

    async def remove_notes(self, project_id: UUID, note_ids: list[UUID]) -> int:
        """Remove notes from a project. Returns number of assignments removed."""
        stmt = delete(NoteProject).where(
            NoteProject.project_id == project_id,
            NoteProject.note_id.in_(note_ids),
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount  # type: ignore[attr-defined]

    async def get_note_ids_for_project(self, project_id: UUID) -> list[UUID]:
        """Get all note IDs assigned to a project."""
        query = select(NoteProject.note_id).where(NoteProject.project_id == project_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_notes_for_project(self, project_id: UUID, user_id: str) -> list[Note]:
        """Get all notes assigned to a project."""
        query = (
            select(Note)
            .join(NoteProject, Note.id == NoteProject.note_id)
            .where(
                NoteProject.project_id == project_id,
                Note.user_id == user_id,
            )
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_project_ids_for_note(self, note_id: UUID) -> list[UUID]:
        """Get all project IDs a note belongs to."""
        query = select(NoteProject.project_id).where(NoteProject.note_id == note_id)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_note_ids_for_projects(
        self, project_ids: list[UUID], user_id: str
    ) -> list[UUID]:
        """Get all note IDs across multiple projects for a user."""
        query = (
            select(NoteProject.note_id)
            .join(Note, Note.id == NoteProject.note_id)
            .where(
                NoteProject.project_id.in_(project_ids),
                Note.user_id == user_id,
            )
            .distinct()
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def close(self) -> None:
        """Close the session."""
        await self.session.close()
