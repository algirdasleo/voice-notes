"""Configuration settings for environment-based secrets."""

from dotenv import find_dotenv
from pydantic import SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Pydantic BaseSettings class for environment-based configuration."""

    # API key for AI services
    OPENAI_API_KEY: SecretStr
    STT_MODEL: str = "whisper-1"
    CHAT_MODEL: str = "gpt-5.1-mini"

    # Database credentials
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: SecretStr | None = None
    POSTGRES_DB: str = "voice_notes"
    POSTGRES_HOST: str = "db"

    # Google OAuth credentials
    GOOGLE_CLIENT_ID: SecretStr
    GOOGLE_CLIENT_SECRET: SecretStr

    # Application URLs
    VITE_BACKEND_URL: str
    VITE_FRONTEND_URL: str

    @property
    def DB_CONNECTION_STRING(self) -> str:
        """Construct database connection string from credentials."""
        if not (self.POSTGRES_USER and self.POSTGRES_PASSWORD):
            raise ValueError(
                "PostgreSQL credentials required. Set POSTGRES_USER and POSTGRES_PASSWORD."
            )
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD.get_secret_value()}@{self.POSTGRES_HOST}:5432/"
            f"{self.POSTGRES_DB}"
        )

    class Config:
        """BaseSettings configuration."""

        env_file = find_dotenv()
        env_file_encoding = "utf-8"
        extra = "ignore"


def get_settings() -> Settings:
    """Retrieve the settings instance."""
    return Settings()  # type: ignore
