"""TTL cache for generated tier lists, keyed by (ticker, model)."""

from __future__ import annotations

import time

from app.schemas import TierList


class TierCache:
    def __init__(self, ttl: int) -> None:
        self._ttl = ttl
        self._store: dict[tuple[str, str], tuple[float, TierList]] = {}

    def get(self, ticker: str, model: str) -> TierList | None:
        key = (ticker.upper(), model)
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() >= expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, ticker: str, model: str, value: TierList) -> None:
        self._store[(ticker.upper(), model)] = (time.monotonic() + self._ttl, value)
