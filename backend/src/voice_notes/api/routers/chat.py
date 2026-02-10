"""API endpoints for AI chat interactions."""

import logging

from fastapi import APIRouter, Depends, WebSocket
from langchain.messages import AIMessage, HumanMessage
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocketDisconnect
from supertokens_python.recipe.session import SessionContainer

from voice_notes.api.dependencies import get_current_user
from voice_notes.models.chat.schemas import AIChatRequest, WebSocketUser
from voice_notes.repositories.projects import ProjectsRepository
from voice_notes.services.auth import AuthService
from voice_notes.services.database import get_engine

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/ws-ticket")
async def create_ws_ticket(
    user: SessionContainer = Depends(get_current_user),
):
    """Create a short-lived ticket for authenticating a WebSocket connection."""
    ticket = AuthService.create_ws_ticket(user.user_id)
    return {"ticket": ticket}


@router.websocket("/ws")
async def chat_with_notes(websocket: WebSocket):
    """Chat with voice notes using AI via streaming agent."""
    # Authenticate the WebSocket connection
    user: WebSocketUser | None = await AuthService.verify_websocket_session(websocket)

    if not user:
        logger.warning("Unauthorized WebSocket connection attempt")
        await websocket.close(code=4401)
        return

    await websocket.accept()
    logger.info(f"WebSocket connection established for user {user.user_id}")

    chat_service = websocket.app.state.chat_service

    # In-memory conversation history for this WebSocket connection
    messages: list[HumanMessage | AIMessage] = []

    try:
        async with AsyncSession(get_engine()) as db_session:
            while True:
                try:
                    data = await websocket.receive_text()
                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected for user {user.user_id}")
                    break
                except Exception as e:
                    logger.error(
                        f"Failed to receive message for user {user.user_id}: {str(e)}",
                        exc_info=True,
                    )
                    try:
                        await websocket.send_json(
                            {
                                "type": "error",
                                "content": f"Failed to receive message: {str(e)}",
                            }
                        )
                    except Exception:
                        pass
                    break

                try:
                    message = AIChatRequest.model_validate_json(data)
                except ValidationError as ex:
                    logger.warning(
                        f"Invalid request schema for user {user.user_id}: {ex.errors()}"
                    )
                    try:
                        await websocket.send_json(
                            {
                                "type": "error",
                                "content": "Invalid request schema",
                                "errors": ex.errors(),
                            }
                        )
                    except Exception:
                        pass
                    continue

                if message.type == "close":
                    try:
                        await websocket.send_json(
                            {
                                "type": "close",
                                "content": "Connection closing gracefully",
                            }
                        )
                        logger.info(
                            f"WebSocket connection closed gracefully for user {user.user_id}"
                        )
                    except Exception as e:
                        logger.error(
                            f"Error sending close message for user {user.user_id}: {str(e)}",
                            exc_info=True,
                        )
                    break

                if message.type == "message":
                    try:
                        # Add user message to history
                        messages.append(HumanMessage(content=message.content))

                        # Resolve project_ids to note_ids if provided
                        note_ids = None
                        if message.project_ids:
                            projects_repo = ProjectsRepository(db_session)
                            note_ids = await projects_repo.get_note_ids_for_projects(
                                message.project_ids, user.user_id
                            )

                        # Stream tokens from the agent
                        full_response = ""
                        async for token in chat_service.stream_response(
                            user_id=user.user_id,
                            messages=messages,
                            session=db_session,
                            note_ids=note_ids,
                        ):
                            full_response += token
                            try:
                                await websocket.send_json(
                                    {"type": "token", "content": token}
                                )
                            except Exception:
                                break

                        # Signal end of stream
                        try:
                            await websocket.send_json({"type": "end", "content": ""})
                        except Exception:
                            pass

                        # Add assistant response to history
                        messages.append(AIMessage(content=full_response))

                        logger.debug(f"Message processed for user {user.user_id}")
                    except Exception as e:
                        logger.error(
                            f"Failed to process message for user {user.user_id}: {str(e)}",
                            exc_info=True,
                        )
                        try:
                            await websocket.send_json(
                                {
                                    "type": "error",
                                    "content": f"Failed to process message: {str(e)}",
                                }
                            )
                        except Exception:
                            pass

    except Exception as e:
        logger.error(
            f"Unexpected error in WebSocket connection for user {user.user_id if user else 'unknown'}: {str(e)}",
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
