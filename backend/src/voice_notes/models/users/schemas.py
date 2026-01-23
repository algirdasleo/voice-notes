"""User request/response schemas."""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Login request schema."""

    email: str
    password: str


class RegisterRequest(BaseModel):
    """Register request schema."""

    email: str
    password: str
