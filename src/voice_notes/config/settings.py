"""Configuration settings for environment-based secrets."""

from pydantic import SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Pydantic BaseSettings class for environment-based configuration."""

    OPENAI_API_KEY: SecretStr  # Required due to Embedder usage
    ANTHROPIC_API_KEY: SecretStr | None = None
    POSTGRES_USER: str
    POSTGRES_PASSWORD: SecretStr
    POSTGRES_DB: str = "voice_notes"

    @property
    def DB_CONNECTION_STRING(self) -> str:
        """Construct database connection string from credentials."""
        return (
            f"postgresql://{self.POSTGRES_USER}:"
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
