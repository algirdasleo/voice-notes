"""API endpoints for AI chat interactions."""

import logging

from fastapi import APIRouter, WebSocket
from pydantic import ValidationError
from supertokens_python.recipe.session import SessionContainer

from voice_notes.models.chat.schemas import AIChatRequest
from voice_notes.services.auth import AuthService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws")
async def chat_with_notes(websocket: WebSocket):
    """Chat with voice notes using AI."""
    # Authenticate the WebSocket connection
    session: SessionContainer | None = await AuthService.verify_websocket_session(
        websocket
    )

    if not session:
        logger.warning("Unauthorized WebSocket connection attempt")
        return

    await websocket.accept()
    logger.info(f"WebSocket connection established for user {session.user_id}")

    chat_service = websocket.app.state.chat_service
    try:
        while True:
            try:
                data = await websocket.receive_text()
            except Exception as e:
                logger.error(
                    f"Failed to receive message for user {session.user_id}: {str(e)}",
                    exc_info=True,
                )
                await websocket.send_json(
                    {"type": "error", "content": f"Failed to receive message: {str(e)}"}
                )
                break

            try:
                message = AIChatRequest.model_validate_json(data)
            except ValidationError as ex:
                logger.warning(
                    f"Invalid request schema for user {session.user_id}: {ex.errors()}"
                )
                await websocket.send_json(
                    {
                        "type": "error",
                        "content": "Invalid request schema",
                        "errors": ex.errors(),
                    }
                )
                continue

            if message.type == "close":
                try:
                    await websocket.send_json(
                        {"type": "close", "content": "Connection closing gracefully"}
                    )
                    logger.info(
                        f"WebSocket connection closed gracefully for user {session.user_id}"
                    )
                except Exception as e:
                    logger.error(
                        f"Error sending close message for user {session.user_id}: {str(e)}",
                        exc_info=True,
                    )
                break

            if message.type == "message":
                try:
                    response = await chat_service.talk_with_notes(
                        user_id=session.user_id, content=message.content
                    )
                    logger.debug(f"Message processed for user {session.user_id}")
                    await websocket.send_json({"type": "response", "content": response})
                except Exception as e:
                    logger.error(
                        f"Failed to process message for user {session.user_id}: {str(e)}",
                        exc_info=True,
                    )
                    await websocket.send_json(
                        {
                            "type": "error",
                            "content": f"Failed to process message: {str(e)}",
                        }
                    )

    except Exception as e:
        logger.error(
            f"Unexpected error in WebSocket connection for user {session.user_id if session else 'unknown'}: {str(e)}",
            exc_info=True,
        )
        try:
            await websocket.send_json(
                {"type": "error", "content": f"Server error: {str(e)}"}
            )
        except Exception as close_error:
            logger.error(
                f"Error sending error message: {str(close_error)}", exc_info=True
            )
        finally:
            try:
                await websocket.close()
            except Exception as close_error:
                logger.error(
                    f"Error closing websocket: {str(close_error)}", exc_info=True
                )
