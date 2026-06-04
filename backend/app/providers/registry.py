"""Selects and composes a provider implementation per vertical.

Default is the deterministic ``mock`` provider. When a real provider is
configured (e.g. FLIGHT_PROVIDER=duffel or =http with a URL), it is wrapped with
a resilient fallback to mock and a TTL cache — so routes stay unchanged while
gaining real data, resilience, and caching.
"""
from __future__ import annotations

import httpx

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
from app.providers.duffel_hotels import DuffelStaysHotelProvider
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
from app.seed import schedule_2026 as _seed

# city_id -> (lat, lng) for host cities; Duffel Stays searches by coordinates.
_CITY_COORDS: dict[str, tuple[float, float]] = {
    str(city["id"]): (float(city["lat"]), float(city["lng"]))
    for city in _seed.CITIES
}


def _locate_city(city_id: str) -> tuple[float, float] | None:
    return _CITY_COORDS.get(city_id)


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
    if settings.hotel_provider == "duffel" and settings.duffel_api_key:
        return DuffelStaysHotelProvider(
            settings.duffel_api_key,
            _locate_city,
            base_url=settings.duffel_base_url,
            timeout=_TIMEOUT,
        )
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


def _error_body(response: httpx.Response) -> object:
    """Best-effort decode of an upstream error payload for diagnostics."""
    try:
        return response.json()
    except ValueError:
        return response.text[:500]


def probe_hotels(query: schemas.HotelSearchQuery) -> dict[str, object]:
    """Call the configured *real* hotel provider directly — no resilient
    fallback, no cache — and report the raw outcome.

    The production path deliberately hides upstream failures by degrading to
    mock, which is great for uptime but useless for diagnosis. This surfaces the
    actual status / error body (auth, validation, enablement) so a deploy can be
    debugged from the browser. It never echoes credentials.
    """
    primary = _hotel_primary()
    if primary is None:
        return _unconfigured("hotel", settings.hotel_provider, "HOTEL_PROVIDER")
    return _probe_provider(primary, query)


def probe_flights(query: schemas.FlightSearchQuery) -> dict[str, object]:
    """Flights counterpart to :func:`probe_hotels` — calls the real flight
    provider (Duffel Air) directly so live integration errors surface instead of
    silently degrading to mock."""
    primary = _flight_primary()
    if primary is None:
        return _unconfigured("flight", settings.flight_provider, "FLIGHT_PROVIDER")
    return _probe_provider(primary, query)


def _unconfigured(vertical: str, configured: str, env_var: str) -> dict[str, object]:
    return {
        "ok": False,
        "configured": configured,
        "reason": (
            f"no real {vertical} provider configured "
            f"(set {env_var}=duffel and DUFFEL_API_KEY)"
        ),
    }


def _probe_provider(
    primary: FlightProvider | HotelProvider,
    query: schemas.FlightSearchQuery | schemas.HotelSearchQuery,
) -> dict[str, object]:
    """Run one real provider search directly and shape the raw outcome —
    surfacing the upstream status / error body that the resilient path hides."""
    try:
        offers = primary.search(query)  # type: ignore[arg-type]
    except httpx.HTTPStatusError as exc:
        return {
            "ok": False,
            "provider": type(primary).__name__,
            "status": exc.response.status_code,
            "upstreamError": _error_body(exc.response),
        }
    except Exception as exc:  # noqa: BLE001 - diagnostic surfaces any failure
        return {
            "ok": False,
            "provider": type(primary).__name__,
            "error": f"{type(exc).__name__}: {exc}",
        }
    return {
        "ok": True,
        "provider": type(primary).__name__,
        "count": len(offers),
        "sample": offers[0].model_dump(by_alias=True) if offers else None,
    }
