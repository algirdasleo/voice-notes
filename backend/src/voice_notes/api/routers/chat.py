"""API endpoints for AI chat interactions."""

from fastapi import APIRouter, WebSocket
from pydantic import ValidationError
from supertokens_python.recipe.session import SessionContainer

from voice_notes.models.chat.schemas import AIChatRequest
from voice_notes.services.auth import AuthService

router = APIRouter()


@router.websocket("/ws")
async def chat_with_notes(websocket: WebSocket):
    """Chat with voice notes using AI."""
    # Authenticate the WebSocket connection
    session: SessionContainer | None = await AuthService.verify_websocket_session(
        websocket
    )

    if not session:
        return

    await websocket.accept()

    chat_service = websocket.app.state.chat_service
    try:
        while True:
            try:
                data = await websocket.receive_text()
            except Exception as e:
                await websocket.send_json(
                    {"type": "error", "content": f"Failed to receive message: {str(e)}"}
                )
                break

            try:
                message = AIChatRequest.model_validate_json(data)
            except ValidationError as ex:
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
                except Exception as e:
                    print(f"Error sending close message: {str(e)}")
                break

            if message.type == "message":
                try:
                    response = await chat_service.talk_with_notes(
                        user_id=session.user_id, content=message.content
                    )
                    await websocket.send_json({"type": "response", "content": response})
                except Exception as e:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "content": f"Failed to process message: {str(e)}",
                        }
                    )

    except Exception as e:
        try:
            await websocket.send_json(
                {"type": "error", "content": f"Server error: {str(e)}"}
            )
        except Exception as close_error:
            print(f"Error sending error message: {str(close_error)}")
        finally:
            try:
                await websocket.close()
            except Exception as close_error:
                print(f"Error closing websocket: {str(close_error)}")
