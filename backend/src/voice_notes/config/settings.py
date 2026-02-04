"""Configuration settings for environment-based secrets."""

from pydantic import SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Pydantic BaseSettings class for environment-based configuration."""

    # API key for AI services
    OPENAI_API_KEY: SecretStr

    # Hugging Face access token for transcribtion model
    HF_ACCESS_TOKEN: SecretStr

    # Database credentials
    POSTGRES_USER: str | None = None
    POSTGRES_PASSWORD: SecretStr | None = None
    POSTGRES_DB: str = "voice_notes"

    # Google OAuth credentials
    GOOGLE_CLIENT_ID: SecretStr
    GOOGLE_CLIENT_SECRET: SecretStr

    # Application URLs
    BACKEND_URL: str
    FRONTEND_URL: str

    @property
    def DB_CONNECTION_STRING(self) -> str:
        """Construct database connection string from credentials."""
        if not (self.POSTGRES_USER and self.POSTGRES_PASSWORD):
            raise ValueError(
                "PostgreSQL credentials required. Set POSTGRES_USER and POSTGRES_PASSWORD."
            )
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD.get_secret_value()}@db:5432/"
            f"{self.POSTGRES_DB}"
        )

    class Config:
        """BaseSettings configuration."""

        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    """Retrieve the settings instance."""
    return Settings()  # type: ignore
