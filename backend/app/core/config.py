"""Application configuration using pydantic-settings."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Session
    session_ttl_hours: int = 24
    data_dir: Path = Path("./data")

    # Server
    host: str = "0.0.0.0"
    port: int = 8002

    @property
    def sessions_dir(self) -> Path:
        return self.data_dir / "sessions"


settings = Settings()

