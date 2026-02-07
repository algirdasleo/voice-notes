"""API health endpoints."""

from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.get("/")
def health_check():
    """Health check endpoint."""
    try:
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )
