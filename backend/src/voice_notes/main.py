"""Main module for Voice Notes backend application."""

import logging

from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager

from voice_notes.api.routers import auth, chat, content, health, notes, speech
from voice_notes.services.chat import ChatService
from voice_notes.services.database import create_tables

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to handle startup and shutdown events."""
    # Initialize database
    try:
        await create_tables()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")

    try:
        app.state.chat_service = ChatService()
        logger.info("Chat service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize chat service: {e}")
        app.state.chat_service = None

    yield


app = FastAPI(lifespan=lifespan)

app.include_router(health.router, prefix="/health", tags=["Health Check"])
app.include_router(notes.router, prefix="/notes", tags=["Voice Notes"])
app.include_router(content.router, prefix="/content", tags=["Notes Content"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(speech.router, prefix="/speech", tags=["Speech"])
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
