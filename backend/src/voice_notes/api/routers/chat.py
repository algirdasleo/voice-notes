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
            data = await websocket.receive_text()

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
                await websocket.send_json(
                    {"type": "close", "content": "Connection closing gracefully"}
                )
                break

            if message.type == "message":
                response = await chat_service.talk_with_notes(
                    user_id=session.user_id, content=message.content
                )
                await websocket.send_json({"type": "response", "content": response})

    except Exception as e:
        await websocket.send_json(
            {"type": "error", "content": f"Server error: {str(e)}"}
        )
        await websocket.close()
