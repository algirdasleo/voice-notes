"""API endpoints for AI chat interactions."""

from fastapi import APIRouter, WebSocket
from pydantic import ValidationError
from starlette import status

from voice_notes.api.dependencies import decode_access_token
from voice_notes.models.ai.schemas import AIChatRequest

router = APIRouter()


@router.websocket(f"/ws/chat")
async def chat_with_notes(websocket: WebSocket):
    """Chat with voice notes using AI."""
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    token_data = decode_access_token(token=token)
    if not token_data:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    ai_service = websocket.app.state.ai_service
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
                response = await ai_service.talk_with_notes(
                    user_id=token_data.user_id, content=message.content
                )
                await websocket.send_json({"type": "response", "content": response})

    except Exception as e:
        await websocket.send_json(
            {"type": "error", "content": f"Server error: {str(e)}"}
        )
        await websocket.close()
