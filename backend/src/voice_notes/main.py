"""Main module for Voice Notes backend application."""

from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager

from voice_notes.api.routers import auth, chat, content, health, notes
from voice_notes.services.chat import ChatService
from voice_notes.services.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to handle startup and shutdown events."""
    await create_tables()

    app.state.chat_service = ChatService()

    yield


app = FastAPI(lifespan=lifespan)

app.include_router(health.router, prefix="/health", tags=["Health Check"])
app.include_router(notes.router, prefix="/notes", tags=["Voice Notes"])
app.include_router(content.router, prefix="/content", tags=["Notes Content"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
