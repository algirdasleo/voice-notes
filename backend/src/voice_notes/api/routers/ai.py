"""API endpoints for AI chat interactions."""

from fastapi import APIRouter, WebSocket
from starlette import status

from voice_notes.api.dependencies import decode_access_token

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

    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text("Echo: " + data)
            await websocket.send_text(f"Access Token data: {token_data.model_dump()}")
    except Exception:
        await websocket.close()
