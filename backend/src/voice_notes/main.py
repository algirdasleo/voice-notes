"""Main module for Voice Notes backend application."""

from fastapi import FastAPI

from voice_notes.api import health, notes

app = FastAPI()

app.include_router(health.router, prefix="/health", tags=["Health Check"])
app.include_router(notes.router, prefix="/notes", tags=["Voice Notes"])
