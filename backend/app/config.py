"""Runtime configuration read from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _cors_origins() -> tuple[str, ...]:
    raw = os.getenv("CORS_ORIGINS") or "http://localhost:3000"
    return tuple(origin.strip() for origin in raw.split(",") if origin.strip())


@dataclass(frozen=True)
class Settings:
    """Backend settings. Provider names select an adapter implementation."""

    database_url: str | None = os.getenv("DATABASE_URL") or None
    cors_origins: tuple[str, ...] = field(default_factory=_cors_origins)
    flight_provider: str = os.getenv("FLIGHT_PROVIDER", "mock")
    hotel_provider: str = os.getenv("HOTEL_PROVIDER", "mock")
    transport_provider: str = os.getenv("TRANSPORT_PROVIDER", "mock")


settings = Settings()
