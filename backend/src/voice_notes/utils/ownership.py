"""Ownership verification utility."""

from typing import TypeVar

from fastapi import HTTPException, status

T = TypeVar("T")


def verify_ownership(
    resource: T | None, user_id: str, resource_name: str = "Resource"
) -> T:
    """Verify resource exists and belongs to the user. Raises 404 if not."""
    if not resource or getattr(resource, "user_id", None) != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} not found",
        )
    return resource
