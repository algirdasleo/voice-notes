"""Model for authenticated users."""

from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """Model representing a user."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str
    password_hash: str
