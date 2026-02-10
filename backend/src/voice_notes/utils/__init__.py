"""Shared utilities for VoiceNotes API."""

from voice_notes.utils.errors import raise_server_error
from voice_notes.utils.ownership import verify_ownership

__all__ = ["raise_server_error", "verify_ownership"]
