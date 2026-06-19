"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven settings. See .env.example for the full list."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    stock_provider: Literal["mock", "finnhub"] = "mock"
    finnhub_api_key: str | None = None
    anthropic_api_key: str | None = None

    tier_model: str = "claude-opus-4-8"
    tier_effort: Literal["low", "medium", "high"] = "high"

    quote_cache_ttl: int = 60
    screener_cache_ttl: int = 900
    tier_cache_ttl: int = 86400

    resilient_fallback: bool = True


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
