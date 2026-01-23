"""VoiceNotes Speech Services module."""

from io import BytesIO

from huggingface_hub import InferenceClient

from voice_notes.config.settings import get_settings

settings = get_settings()

client = InferenceClient(
    model="openai/whisper-large-v3", token=settings.HF_ACCESS_TOKEN.get_secret_value()
)


def transcribe_audio(audio_bytes: BytesIO) -> str:
    """Transcribe audio file using Hugging Face transcription models."""
    return client.automatic_speech_recognition(audio_bytes).text
