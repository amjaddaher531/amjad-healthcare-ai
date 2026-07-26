"""
Central configuration for Amjad Healthcare AI backend.
Loaded from environment variables (.env in local dev, real secrets manager in prod).
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # AI provider
    anthropic_api_key: str = ""
    ai_model: str = "claude-sonnet-4-6"
    openai_api_base: str = ""
    openai_api_key: str = ""

    # DB
    database_url: str = "sqlite+aiosqlite:///./amjad_healthcare.db"

    # App
    env: str = "development"
    cors_origins: str = "http://localhost:3000"
    max_upload_mb: int = 25

    # OCR
    tesseract_cmd: str = "/usr/bin/tesseract"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
