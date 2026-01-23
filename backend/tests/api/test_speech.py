"""Tests for speech transcription endpoint."""

from fastapi.testclient import TestClient


class TestSpeech:
    """Tests for speech transcription endpoint."""

    def test_transcribe_requires_file(self, ws_client: TestClient):
        """Test transcribe endpoint requires file parameter."""
        response = ws_client.post("/speech/transcribe")
        assert response.status_code == 422  # Unprocessable Entity

    def test_transcribe_with_valid_audio(self, ws_client: TestClient):
        """Test transcribe endpoint with valid audio file."""
        # Mock audio file
        audio_content = b"mock_audio_data"
        response = ws_client.post(
            "/speech/transcribe",
            files={"file": ("test_audio.wav", audio_content, "audio/wav")},
        )
        assert response.status_code == 200
        assert "text" in response.json()

    def test_transcribe_returns_text_field(self, ws_client: TestClient):
        """Test transcribe endpoint returns text field in response."""
        audio_content = b"mock_audio_data"
        response = ws_client.post(
            "/speech/transcribe",
            files={"file": ("test_audio.wav", audio_content, "audio/wav")},
        )
        data = response.json()
        assert isinstance(data, dict)
        assert "text" in data
        assert isinstance(data["text"], (str, type(None)))
