"""Repository for auth related database operations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from voice_notes.models.user import User


class AuthRepository:
    """Repository for authentication data access operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with async session."""
        self.session = session

    async def get_user(self, email: str) -> User | None:
        """Check if an email is already registered."""
        user_result = await self.session.execute(
            select(User).where(User.email == email)
        )

        return user_result.scalar_one_or_none()

    async def add_user(self, email: str, password_hash: str) -> None:
        """Add a new user."""
        if await self.get_user(email):
            return None  # User already exists

        new_user = User(email=email, password_hash=password_hash)
        self.session.add(new_user)
        await self.session.commit()
        await self.session.refresh(new_user)
