"""Composable provider wrappers: caching and resilience."""

from __future__ import annotations

import logging
import time
from collections.abc import Awaitable
from typing import Any, TypeVar, cast

from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.schemas import HotStock, TickerDetail

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CachedProvider(StockDataProvider):
    """In-memory TTL cache around another provider.

    Swappable for Redis later behind the same interface.
    """

    def __init__(
        self,
        inner: StockDataProvider,
        *,
        quote_ttl: int,
        screener_ttl: int,
    ) -> None:
        self._inner = inner
        self._quote_ttl = quote_ttl
        self._screener_ttl = screener_ttl
        self._cache: dict[str, tuple[float, Any]] = {}

    def _get(self, key: str) -> Any | None:
        entry = self._cache.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() >= expires_at:
            self._cache.pop(key, None)
            return None
        return value

    def _set(self, key: str, value: Any, ttl: int) -> None:
        self._cache[key] = (time.monotonic() + ttl, value)

    async def screen_hot_stocks(self, low: float = 0.50, high: float = 1.00) -> list[HotStock]:
        key = f"screen:{low}:{high}"
        cached = self._get(key)
        if cached is not None:
            return cast(list[HotStock], cached)
        result = await self._inner.screen_hot_stocks(low, high)
        self._set(key, result, self._screener_ttl)
        return result

    async def get_quote(self, ticker: str) -> TickerDetail:
        key = f"quote:{ticker.upper()}"
        cached = self._get(key)
        if cached is not None:
            return cast(TickerDetail, cached)
        result = await self._inner.get_quote(ticker)
        self._set(key, result, self._quote_ttl)
        return result

    async def get_universe(self) -> set[str]:
        key = "universe"
        cached = self._get(key)
        if cached is not None:
            return cast(set[str], cached)
        result = await self._inner.get_universe()
        self._set(key, result, self._screener_ttl)
        return result


class ResilientProvider(StockDataProvider):
    """Try the primary provider; on upstream failure, fall back to a backup.

    AppError (e.g. a 404 for an unknown ticker) is a legitimate domain result
    and is re-raised, not swallowed.
    """

    def __init__(self, primary: StockDataProvider, fallback: StockDataProvider) -> None:
        self._primary = primary
        self._fallback = fallback

    async def _run(
        self, name: str, primary_coro: Awaitable[T], fallback_coro: Awaitable[T]
    ) -> T:
        try:
            return await primary_coro
        except AppError:
            raise
        except (ProviderError, TimeoutError, OSError) as exc:
            logger.warning("primary provider failed on %s (%s); using fallback", name, exc)
            return await fallback_coro

    async def screen_hot_stocks(self, low: float = 0.50, high: float = 1.00) -> list[HotStock]:
        return await self._run(
            "screen_hot_stocks",
            self._primary.screen_hot_stocks(low, high),
            self._fallback.screen_hot_stocks(low, high),
        )

    async def get_quote(self, ticker: str) -> TickerDetail:
        return await self._run(
            "get_quote",
            self._primary.get_quote(ticker),
            self._fallback.get_quote(ticker),
        )

    async def get_universe(self) -> set[str]:
        return await self._run(
            "get_universe",
            self._primary.get_universe(),
            self._fallback.get_universe(),
        )
