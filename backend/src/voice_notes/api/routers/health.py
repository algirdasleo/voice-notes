"""API health endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
def health_check():
    """Health check endpoint."""
    try:
        logger.debug("Health check performed")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )
