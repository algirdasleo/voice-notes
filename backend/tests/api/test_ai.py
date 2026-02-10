"""Tests for AI chat WebSocket endpoint."""

import pytest
from fastapi.testclient import TestClient


class TestAI:
    """Tests for AI chat endpoint."""

    @pytest.mark.asyncio
    async def test_websocket_requires_auth(self, ws_client: TestClient):
        """Test WebSocket connection without ticket closes with policy violation."""
        with pytest.raises(Exception):
            with ws_client.websocket_connect("/chat/ws"):
                pass

    @pytest.mark.asyncio
    async def test_websocket_with_invalid_ticket(self, ws_client: TestClient):
        """Test WebSocket connection with invalid ticket closes."""
        with pytest.raises(Exception):
            with ws_client.websocket_connect("/chat/ws?ticket=invalid_ticket"):
                pass

    @pytest.mark.asyncio
    async def test_websocket_connect_with_valid_ticket(
        self, ws_client: TestClient, token: str
    ):
        """Test WebSocket connection with valid ticket."""
        with ws_client.websocket_connect(f"/chat/ws?ticket={token}") as websocket:
            # Send invalid JSON to test error handling
            websocket.send_text("invalid json")
            data = websocket.receive_json()
            assert data["type"] == "error"
            assert "Invalid request schema" in data["content"]

    @pytest.mark.asyncio
    async def test_websocket_send_close_message(
        self, ws_client: TestClient, token: str
    ):
        """Test sending close message through WebSocket."""
        with ws_client.websocket_connect(f"/chat/ws?ticket={token}") as websocket:
            message = {"type": "close"}
            websocket.send_json(message)
            data = websocket.receive_json()
            assert data["type"] == "close"

    @pytest.mark.asyncio
    async def test_websocket_message_validation(
        self, ws_client: TestClient, token: str
    ):
        """Test WebSocket validates message format."""
        with ws_client.websocket_connect(f"/chat/ws?ticket={token}") as websocket:
            websocket.send_text("not valid json or message")
            data = websocket.receive_json()
            assert data["type"] == "error"
            assert "errors" in data
