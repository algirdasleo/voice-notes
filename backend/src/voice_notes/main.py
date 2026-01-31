"""Main module for Voice Notes backend application."""

import logging

from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from supertokens_python import InputAppInfo, SupertokensConfig, init
from supertokens_python.recipe import emailpassword, session, thirdparty, usermetadata
from supertokens_python.recipe.thirdparty.provider import (
    ProviderClientConfig,
    ProviderConfig,
    ProviderInput,
)

from voice_notes.api.routers import auth, chat, content, health, notes, speech
from voice_notes.config.settings import get_settings
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


settings = get_settings()
app = FastAPI(lifespan=lifespan)


init(
    app_info=InputAppInfo(
        app_name="VoiceNotes",
        api_domain=settings.BACKEND_URL,
        website_domain=settings.FRONTEND_URL,
        api_base_path="/auth",
    ),
    supertokens_config=SupertokensConfig(connection_uri="https://try.supertokens.io"),
    framework="fastapi",
    recipe_list=[
        emailpassword.init(),
        session.init(),
        usermetadata.init(),
        thirdparty.init(
            sign_in_and_up_feature=thirdparty.SignInAndUpFeature(
                providers=[
                    ProviderInput(
                        config=ProviderConfig(
                            third_party_id="google",
                            clients=[
                                ProviderClientConfig(
                                    client_id=settings.GOOGLE_CLIENT_ID,
                                    client_secret=settings.GOOGLE_CLIENT_SECRET,
                                )
                            ],
                        )
                    )
                ]
            )
        ),
    ],
)

app.include_router(health.router, prefix="/health", tags=["Health Check"])
app.include_router(notes.router, prefix="/notes", tags=["Voice Notes"])
app.include_router(content.router, prefix="/content", tags=["Notes Content"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(speech.router, prefix="/speech", tags=["Speech"])
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
