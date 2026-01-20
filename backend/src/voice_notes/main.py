"""Main module for Voice Notes backend application."""

from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager

from voice_notes.api.routers import health, notes
from voice_notes.services.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to handle startup and shutdown events."""
    create_tables()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(health.router, prefix="/health", tags=["Health Check"])
app.include_router(notes.router, prefix="/notes", tags=["Voice Notes"])
