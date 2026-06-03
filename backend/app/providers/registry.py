"""Selects and composes a provider implementation per vertical.

Default is the deterministic ``mock`` provider. When a real provider is
configured (e.g. FLIGHT_PROVIDER=duffel or =http with a URL), it is wrapped with
a resilient fallback to mock and a TTL cache — so routes stay unchanged while
gaining real data, resilience, and caching.
"""
from __future__ import annotations

from app import schemas
from app.config import settings
from app.providers.base import FlightProvider, HotelProvider, TransportProvider
from app.providers.cache import (
    CachedFlightProvider,
    CachedHotelProvider,
    CachedTransportProvider,
    TtlCache,
)
from app.providers.duffel_flights import DuffelFlightProvider
from app.providers.http_providers import (
    HttpFlightProvider,
    HttpHotelProvider,
    HttpTransportProvider,
)
from app.providers.mock_flights import MockFlightProvider
from app.providers.mock_hotels import MockHotelProvider
from app.providers.mock_transport import MockTransportProvider
from app.providers.resilient import (
    ResilientFlightProvider,
    ResilientHotelProvider,
    ResilientTransportProvider,
)

_TIMEOUT = settings.provider_timeout_seconds
_flight_cache: TtlCache[list[schemas.FlightOffer]] = TtlCache(
    settings.provider_cache_ttl_seconds
)
_hotel_cache: TtlCache[list[schemas.HotelOffer]] = TtlCache(
    settings.provider_cache_ttl_seconds
)
_transport_cache: TtlCache[list[schemas.TransportOffer]] = TtlCache(
    settings.provider_cache_ttl_seconds
)


def _flight_primary() -> FlightProvider | None:
    if settings.flight_provider == "duffel" and settings.duffel_api_key:
        return DuffelFlightProvider(
            settings.duffel_api_key,
            base_url=settings.duffel_base_url,
            timeout=_TIMEOUT,
        )
    if settings.flight_provider == "http" and settings.flights_api_url:
        return HttpFlightProvider(
            settings.flights_api_url, settings.flights_api_key, timeout=_TIMEOUT
        )
    return None


def _hotel_primary() -> HotelProvider | None:
    if settings.hotel_provider == "http" and settings.hotels_api_url:
        return HttpHotelProvider(
            settings.hotels_api_url, settings.hotels_api_key, timeout=_TIMEOUT
        )
    return None


def _transport_primary() -> TransportProvider | None:
    if settings.transport_provider == "http" and settings.transport_api_url:
        return HttpTransportProvider(
            settings.transport_api_url,
            settings.transport_api_key,
            timeout=_TIMEOUT,
        )
    return None


def flight_provider() -> FlightProvider:
    primary = _flight_primary()
    if primary is None:
        return MockFlightProvider()
    return CachedFlightProvider(
        ResilientFlightProvider(primary, MockFlightProvider()), _flight_cache
    )


def hotel_provider() -> HotelProvider:
    primary = _hotel_primary()
    if primary is None:
        return MockHotelProvider()
    return CachedHotelProvider(
        ResilientHotelProvider(primary, MockHotelProvider()), _hotel_cache
    )


def transport_provider() -> TransportProvider:
    primary = _transport_primary()
    if primary is None:
        return MockTransportProvider()
    return CachedTransportProvider(
        ResilientTransportProvider(primary, MockTransportProvider()),
        _transport_cache,
    )


def provider_status() -> dict[str, dict[str, object]]:
    def describe(configured: str, has_primary: bool) -> dict[str, object]:
        return {
            "configured": configured,
            "mode": "real" if has_primary else "mock",
            "cached": has_primary,
            "fallbackToMock": has_primary,
        }

    return {
        "flights": describe(settings.flight_provider, _flight_primary() is not None),
        "hotels": describe(settings.hotel_provider, _hotel_primary() is not None),
        "transport": describe(
            settings.transport_provider, _transport_primary() is not None
        ),
    }
