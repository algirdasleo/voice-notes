"""Models for authentication and authorization."""

from uuid import UUID

from pydantic import BaseModel


class AccessTokenData(BaseModel):
    """Data contained in the access token."""

    user_id: UUID
    exp_date: int
