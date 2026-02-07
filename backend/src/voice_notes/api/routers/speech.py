"""Speech API router module."""

import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from supertokens_python.recipe.session import SessionContainer

from voice_notes.api.dependencies import get_current_user
from voice_notes.services.speech import transcribe_audio

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/transcribe")
async def transcribe_speech(
    file: UploadFile,
    user: SessionContainer = Depends(get_current_user),
):
    """Endpoint to transcribe speech from an audio file."""
    try:
        audio_bytes = await file.read()
        result = await transcribe_audio(audio_bytes)
        logger.info(f"Audio transcribed successfully for user {user.user_id}")
        return {"text": result}
    except Exception as e:
        logger.error(
            f"Failed to transcribe speech for user {user.user_id}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe speech: {str(e)}",
        )
