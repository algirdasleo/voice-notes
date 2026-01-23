"""VoiceNotes Speech Services module."""

import asyncio

from huggingface_hub import InferenceClient

from voice_notes.config.settings import get_settings

settings = get_settings()

client = InferenceClient(
    model="openai/whisper-large-v3", token=settings.HF_ACCESS_TOKEN.get_secret_value()
)


async def transcribe_audio(audio_data: bytes) -> str:
    """Transcribe audio file using Hugging Face transcription models."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, lambda: client.automatic_speech_recognition(audio_data)
    )  # Wrap the blocking call in asyncio's run_in_executor to avoid blocking the event loop
    return result.text
