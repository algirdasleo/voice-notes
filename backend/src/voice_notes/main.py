"""Main module for Voice Notes backend application."""

import logging

from fastapi import FastAPI, Request
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supertokens_python import (
    InputAppInfo,
    SupertokensConfig,
    get_all_cors_headers,
    init,
)
from supertokens_python.framework.fastapi import (
    get_middleware,
)
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
from voice_notes.services.vector_store import VectorStoreService

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
        vector_store_service = VectorStoreService()
        app.state.vector_store_service = vector_store_service
        app.state.chat_service = ChatService(vector_store=vector_store_service)
        logger.info("Chat and vector store services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        app.state.chat_service = None
        app.state.vector_store_service = None

    yield


settings = get_settings()
app = FastAPI(lifespan=lifespan)


init(
    app_info=InputAppInfo(
        app_name="VoiceNotes",
        api_domain=settings.VITE_BACKEND_URL,
        website_domain=settings.VITE_FRONTEND_URL,
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
                                    client_id=settings.GOOGLE_CLIENT_ID.get_secret_value(),
                                    client_secret=settings.GOOGLE_CLIENT_SECRET.get_secret_value(),
                                )
                            ],
                        )
                    )
                ]
            )
        ),
    ],
)

app.add_middleware(get_middleware())

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.VITE_FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type"] + get_all_cors_headers(),
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all handler so error responses go through CORS middleware."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(health.router, prefix="/health", tags=["Health Check"])
app.include_router(notes.router, prefix="/notes", tags=["Voice Notes"])
app.include_router(content.router, prefix="/content", tags=["Notes Content"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(speech.router, prefix="/speech", tags=["Speech"])
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
