"""Authentication schemas for request/response handling."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Schema for user login request."""

    username: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Schema for user registration request."""

    username: EmailStr
    password: str
