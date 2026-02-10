"""Error handling utility."""

import logging
from typing import NoReturn

from fastapi import HTTPException, status


def raise_server_error(
    logger: logging.Logger, message: str, error: Exception
) -> NoReturn:
    """Log an error and raise HTTP 500."""
    logger.error(f"{message}: {error}", exc_info=True)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"{message}: {error}",
    )
