"""API Endpoints for authentication."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from supertokens_python.recipe.session.framework.fastapi import verify_session
from supertokens_python.recipe.usermetadata.asyncio import get_user_metadata

logger = logging.getLogger(__name__)
router = APIRouter()


async def me(user=Depends(verify_session())):
    """Get the current authenticated user's information."""
    try:
        metadata = await get_user_metadata(user.user_id)
        logger.info(f"User metadata retrieved for user {user.user_id}")
        return {
            "user_id": user.user_id,
            "email": user.user_id,
            "metadata": metadata.metadata if metadata.metadata else {},
        }
    except Exception as e:
        logger.error(
            f"Failed to get user information for user {user.user_id}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user information: {str(e)}",
        )
