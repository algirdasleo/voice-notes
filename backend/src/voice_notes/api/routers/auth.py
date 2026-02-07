"""API Endpoints for authentication."""

from fastapi import APIRouter, Depends, HTTPException, status
from supertokens_python.recipe.session.framework.fastapi import verify_session
from supertokens_python.recipe.usermetadata.asyncio import get_user_metadata

router = APIRouter()


async def me(user=Depends(verify_session())):
    """Get the current authenticated user's information."""
    try:
        metadata = await get_user_metadata(user.user_id)
        return {
            "user_id": user.user_id,
            "email": user.user_id,
            "metadata": metadata.metadata if metadata.metadata else {},
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user information: {str(e)}",
        )
