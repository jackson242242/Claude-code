"""A small TTL cache plus caching wrappers for the provider adapters.

Search results are cached by their normalized query so repeated lookups (and
the itinerary suggestion engine, which fans out many searches) stay fast and
avoid hammering real upstream APIs.
"""
from __future__ import annotations

import json
import threading
import time
from typing import Generic, TypeVar

from app import schemas
from app.providers.base import FlightProvider, HotelProvider, TransportProvider

T = TypeVar("T")


class TtlCache(Generic[T]):
    def __init__(self, ttl_seconds: float) -> None:
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
        self._store: dict[str, tuple[float, T]] = {}

    def get(self, key: str) -> T | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if expires_at < time.monotonic():
                self._store.pop(key, None)
                return None
            return value

    def set(self, key: str, value: T) -> None:
        with self._lock:
            self._store[key] = (time.monotonic() + self._ttl, value)


def _key(prefix: str, query: schemas.CamelModel) -> str:
    return f"{prefix}:" + json.dumps(query.model_dump(by_alias=True), sort_keys=True)


class CachedFlightProvider(FlightProvider):
    def __init__(
        self, inner: FlightProvider, cache: TtlCache[list[schemas.FlightOffer]]
    ) -> None:
        self._inner = inner
        self._cache = cache

    def search(
        self, query: schemas.FlightSearchQuery
    ) -> list[schemas.FlightOffer]:
        key = _key("flight", query)
        cached = self._cache.get(key)
        if cached is not None:
            return cached
        result = self._inner.search(query)
        self._cache.set(key, result)
        return result


class CachedHotelProvider(HotelProvider):
    def __init__(
        self, inner: HotelProvider, cache: TtlCache[list[schemas.HotelOffer]]
    ) -> None:
        self._inner = inner
        self._cache = cache

    def search(self, query: schemas.HotelSearchQuery) -> list[schemas.HotelOffer]:
        key = _key("hotel", query)
        cached = self._cache.get(key)
        if cached is not None:
            return cached
        result = self._inner.search(query)
        self._cache.set(key, result)
        return result


class CachedTransportProvider(TransportProvider):
    def __init__(
        self,
        inner: TransportProvider,
        cache: TtlCache[list[schemas.TransportOffer]],
    ) -> None:
        self._inner = inner
        self._cache = cache

    def search(
        self, query: schemas.TransportSearchQuery
    ) -> list[schemas.TransportOffer]:
        key = _key("transport", query)
        cached = self._cache.get(key)
        if cached is not None:
            return cached
        result = self._inner.search(query)
        self._cache.set(key, result)
        return result
