"""Shared API dependencies."""

from fastapi import Depends
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.session.framework.fastapi import verify_session


async def get_current_user(
    user: SessionContainer = Depends(verify_session()),
) -> SessionContainer:
    """Dependency to get the current authenticated user."""
    return user
