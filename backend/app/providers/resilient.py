"""Resilience wrappers: try a primary (real) provider, and on any failure or
timeout fall back to a secondary (mock) provider so the product degrades
gracefully instead of erroring."""
from __future__ import annotations

import logging

from app import schemas
from app.providers.base import FlightProvider, HotelProvider, TransportProvider

logger = logging.getLogger("providers")


class ResilientFlightProvider(FlightProvider):
    def __init__(self, primary: FlightProvider, fallback: FlightProvider) -> None:
        self._primary = primary
        self._fallback = fallback

    def search(
        self, query: schemas.FlightSearchQuery
    ) -> list[schemas.FlightOffer]:
        try:
            return self._primary.search(query)
        except Exception:  # noqa: BLE001 - degrade to fallback on any error
            logger.warning("flight provider failed; using fallback", exc_info=True)
            return self._fallback.search(query)


class ResilientHotelProvider(HotelProvider):
    def __init__(self, primary: HotelProvider, fallback: HotelProvider) -> None:
        self._primary = primary
        self._fallback = fallback

    def search(self, query: schemas.HotelSearchQuery) -> list[schemas.HotelOffer]:
        try:
            return self._primary.search(query)
        except Exception:  # noqa: BLE001
            logger.warning("hotel provider failed; using fallback", exc_info=True)
            return self._fallback.search(query)


class ResilientTransportProvider(TransportProvider):
    def __init__(
        self, primary: TransportProvider, fallback: TransportProvider
    ) -> None:
        self._primary = primary
        self._fallback = fallback

    def search(
        self, query: schemas.TransportSearchQuery
    ) -> list[schemas.TransportOffer]:
        try:
            return self._primary.search(query)
        except Exception:  # noqa: BLE001
            logger.warning("transport provider failed; using fallback", exc_info=True)
            return self._fallback.search(query)
