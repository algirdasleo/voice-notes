"""Authentication service."""

import logging
import secrets
import time

from fastapi import WebSocket

from voice_notes.models.chat.schemas import WebSocketUser

logger = logging.getLogger(__name__)

# Ticket TTL in seconds (30s for the frontend to connect)
_TICKET_TTL = 30

# In-memory store: ticket -> (user_id, created_at)
_ws_tickets: dict[str, tuple[str, float]] = {}


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def create_ws_ticket(user_id: str) -> str:
        """Create a short-lived ticket that can be exchanged for a WebSocket connection.

        Args:
            user_id: The authenticated user's ID.

        Returns:
            A random ticket string.
        """
        # Purge expired tickets
        now = time.time()
        expired = [k for k, (_, ts) in _ws_tickets.items() if now - ts > _TICKET_TTL]
        for k in expired:
            del _ws_tickets[k]

        ticket = secrets.token_urlsafe(32)
        _ws_tickets[ticket] = (user_id, now)
        return ticket

    @staticmethod
    async def verify_websocket_session(websocket: WebSocket) -> WebSocketUser | None:
        """Verify a WebSocket connection using a one-time ticket.

        The frontend first calls ``POST /chat/ws-ticket`` (authenticated via
        SuperTokens cookies) to obtain a short-lived ticket, then passes it
        as ``?ticket=`` on the WebSocket URL.

        Args:
            websocket: The WebSocket connection.
        """
        ticket = websocket.query_params.get("ticket")
        if not ticket:
            logger.warning("WebSocket connection attempt without ticket")
            return None

        entry = _ws_tickets.pop(ticket, None)
        if entry is None:
            logger.warning("WebSocket ticket not found or already used")
            return None

        user_id, created_at = entry
        if time.time() - created_at > _TICKET_TTL:
            logger.warning("WebSocket ticket expired")
            return None

        return WebSocketUser(user_id=user_id)
