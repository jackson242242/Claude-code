"""Selects a provider implementation per vertical based on configuration.

Today only the ``mock`` implementations are registered. Real adapters can be
added to these maps (e.g. ``"duffel": DuffelFlightProvider``) and selected via
the FLIGHT_PROVIDER / HOTEL_PROVIDER / TRANSPORT_PROVIDER environment variables.
"""
from __future__ import annotations

from app.config import settings
from app.providers.base import FlightProvider, HotelProvider, TransportProvider
from app.providers.mock_flights import MockFlightProvider
from app.providers.mock_hotels import MockHotelProvider
from app.providers.mock_transport import MockTransportProvider

_FLIGHT_PROVIDERS: dict[str, type[FlightProvider]] = {"mock": MockFlightProvider}
_HOTEL_PROVIDERS: dict[str, type[HotelProvider]] = {"mock": MockHotelProvider}
_TRANSPORT_PROVIDERS: dict[str, type[TransportProvider]] = {
    "mock": MockTransportProvider
}


def flight_provider() -> FlightProvider:
    return _FLIGHT_PROVIDERS.get(settings.flight_provider, MockFlightProvider)()


def hotel_provider() -> HotelProvider:
    return _HOTEL_PROVIDERS.get(settings.hotel_provider, MockHotelProvider)()


def transport_provider() -> TransportProvider:
    return _TRANSPORT_PROVIDERS.get(
        settings.transport_provider, MockTransportProvider
    )()
