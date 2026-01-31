"""Speech API router module."""

from fastapi import APIRouter, Depends, UploadFile
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.session.framework.fastapi import verify_session

from voice_notes.services.speech import transcribe_audio

router = APIRouter()


@router.post("/transcribe")
async def transcribe_speech(
    file: UploadFile,
    user: SessionContainer = Depends(verify_session),
):
    """Endpoint to transcribe speech from an audio file."""
    audio_bytes = await file.read()
    return {"text": await transcribe_audio(audio_bytes)}
