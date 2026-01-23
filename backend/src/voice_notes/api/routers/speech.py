"""Speech API router module."""

from fastapi import APIRouter, UploadFile

from voice_notes.services.speech import transcribe_audio

router = APIRouter()


@router.post("/transcribe")
async def transcribe_speech(file: UploadFile):
    """Endpoint to transcribe speech from an audio file."""
    audio_bytes = await file.read()
    return {"text": await transcribe_audio(audio_bytes)}
