"""API Endpoints for authentication."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from supertokens_python.recipe.session.framework.fastapi import verify_session
from supertokens_python.recipe.usermetadata.asyncio import (
    get_user_metadata,
    update_user_metadata,
)

from voice_notes.models.auth.schemas import UpdateMetadataRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/me")
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


@router.post("/metadata")
async def update_metadata(
    request: UpdateMetadataRequest, user=Depends(verify_session())
):
    """Update the current authenticated user's metadata."""
    try:
        # Prepare metadata update
        metadata_update = {}
        if request.name is not None:
            metadata_update["name"] = request.name

        # Update user metadata
        await update_user_metadata(user.user_id, metadata_update)
        logger.info(f"User metadata updated for user {user.user_id}")

        # Return updated metadata
        metadata = await get_user_metadata(user.user_id)
        return {
            "user_id": user.user_id,
            "metadata": metadata.metadata if metadata.metadata else {},
        }
    except Exception as e:
        logger.error(
            f"Failed to update user metadata for user {user.user_id}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user metadata: {str(e)}",
        )
