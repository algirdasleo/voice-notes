"""Authentication service."""

from fastapi import WebSocket
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.session.asyncio import get_session


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    async def verify_websocket_session(websocket: WebSocket) -> SessionContainer | None:
        """Verify WebSocket session and return authenticated session container.

        Args:
            websocket: The WebSocket connection
        """
        try:
            token = websocket.query_params.get("token")
            if not token:
                await websocket.close(code=4401)
                return None

            session: SessionContainer | None = await get_session(token)
            if not session:
                await websocket.close(code=4401)
                return None

            return session
        except Exception:
            await websocket.close(code=4401)
            return None
