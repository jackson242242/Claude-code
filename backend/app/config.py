"""Runtime configuration read from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _cors_origins() -> tuple[str, ...]:
    raw = os.getenv("CORS_ORIGINS") or "http://localhost:3000"
    origins: list[str] = []
    for origin in raw.split(","):
        origin = origin.strip()
        if not origin:
            continue
        # Accept a bare host (e.g. a platform's service-to-service reference)
        # by defaulting to https, and drop any trailing slash for exact match.
        if not origin.startswith(("http://", "https://")):
            origin = f"https://{origin}"
        origins.append(origin.rstrip("/"))
    return tuple(origins)


def _float(name: str, default: str) -> float:
    try:
        return float(os.getenv(name, default))
    except ValueError:
        return float(default)


@dataclass(frozen=True)
class Settings:
    """Backend settings. Provider names select an adapter implementation."""

    database_url: str | None = os.getenv("DATABASE_URL") or None
    cors_origins: tuple[str, ...] = field(default_factory=_cors_origins)

    # Provider selection: "mock" (default), "http", or a branded adapter
    # such as "duffel" for flights.
    flight_provider: str = os.getenv("FLIGHT_PROVIDER", "mock")
    hotel_provider: str = os.getenv("HOTEL_PROVIDER", "mock")
    transport_provider: str = os.getenv("TRANSPORT_PROVIDER", "mock")

    # Real-integration tuning (Phase 3).
    provider_timeout_seconds: float = field(
        default_factory=lambda: _float("PROVIDER_TIMEOUT_SECONDS", "6")
    )
    provider_cache_ttl_seconds: float = field(
        default_factory=lambda: _float("PROVIDER_CACHE_TTL_SECONDS", "120")
    )

    # Generic "bring your own service" HTTP providers.
    flights_api_url: str | None = os.getenv("FLIGHTS_API_URL") or None
    flights_api_key: str | None = os.getenv("FLIGHTS_API_KEY") or None
    hotels_api_url: str | None = os.getenv("HOTELS_API_URL") or None
    hotels_api_key: str | None = os.getenv("HOTELS_API_KEY") or None
    transport_api_url: str | None = os.getenv("TRANSPORT_API_URL") or None
    transport_api_key: str | None = os.getenv("TRANSPORT_API_KEY") or None

    # Branded flight adapter (Duffel).
    duffel_api_key: str | None = os.getenv("DUFFEL_API_KEY") or None
    duffel_base_url: str = os.getenv("DUFFEL_BASE_URL", "https://api.duffel.com")

    # Payments (Phase 4). Default is the affiliate / no-charge model.
    payment_gateway: str = os.getenv("PAYMENT_GATEWAY", "none")
    stripe_secret_key: str | None = os.getenv("STRIPE_SECRET_KEY") or None


settings = Settings()
