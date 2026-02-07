"""VoiceNotes Speech Services module."""

import asyncio
from io import BytesIO

from openai import OpenAI

from voice_notes.config.settings import get_settings

settings = get_settings()

client = OpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())


async def transcribe_audio(audio_data: bytes) -> str:
    """Transcribe audio file using OpenAI's Whisper API."""
    loop = asyncio.get_event_loop()

    def _transcribe():
        audio_file = BytesIO(audio_data)
        transcript = client.audio.transcriptions.create(
            model=settings.STT_MODEL,
            file=("audio.wav", audio_file, "audio/wav"),
        )
        return transcript.text

    return await loop.run_in_executor(None, _transcribe)
