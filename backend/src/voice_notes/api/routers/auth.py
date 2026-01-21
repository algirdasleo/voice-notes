"""API Endpoints for authentication."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from voice_notes.api.dependencies import create_jwt, hash_password, verify_password
from voice_notes.models.schemas.auth import LoginRequest, RegisterRequest
from voice_notes.repositories.auth import AuthRepository
from voice_notes.services.database import get_session

router = APIRouter()


@router.post("/login", status_code=204)
async def login(
    credentials: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    """User login endpoint."""
    repository = AuthRepository(session)
    user = await repository.get_user(credentials.username)

    if user and verify_password(credentials.password, user.password_hash):
        response.set_cookie(
            "access_token",
            create_jwt(user.id, 600),
            httponly=True,
            secure=True,
            samesite="strict",
        )
        return None

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
    )


@router.post("/register", status_code=201)
async def register(
    credentials: RegisterRequest, session: AsyncSession = Depends(get_session)
):
    """User registration endpoint."""
    repository = AuthRepository(session)

    await repository.add_user(credentials.username, hash_password(credentials.password))
