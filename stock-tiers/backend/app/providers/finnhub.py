"""Real market-data provider backed by the Finnhub API.

Endpoints used:
- GET /quote                -> current price (c)
- GET /stock/profile2       -> name, finnhubIndustry (sector), currency
- GET /stock/candle (D)     -> ~52wk daily closes for trailing-1yr change

The screener has no native "+50-100%" endpoint, so it fans out across a bundled
candidate list under a bounded semaphore and filters by computed change.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, cast

import httpx

from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.providers.sp500 import SP500_CANDIDATES
from app.schemas import HotStock, TickerDetail

_BASE_URL = "https://finnhub.io/api/v1"
_SECONDS_PER_YEAR = 365 * 24 * 60 * 60
_SCREEN_CONCURRENCY = 8
_TIMEOUT = 8.0


class FinnhubStockDataProvider(StockDataProvider):
    def __init__(self, api_key: str) -> None:
        self._client = httpx.AsyncClient(
            base_url=_BASE_URL,
            params={"token": api_key},
            timeout=_TIMEOUT,
        )

    async def _get(self, path: str, **params: str | int) -> dict[str, Any]:
        try:
            resp = await self._client.get(path, params=params)
            resp.raise_for_status()
            return cast(dict[str, Any], resp.json())
        except httpx.HTTPError as exc:  # network, timeout, non-2xx
            raise ProviderError(f"finnhub {path} failed: {exc}") from exc

    async def _one_year_change(self, ticker: str) -> float | None:
        now = int(time.time())
        candle = await self._get(
            "/stock/candle",
            symbol=ticker,
            resolution="D",
            **{"from": now - _SECONDS_PER_YEAR, "to": now},
        )
        if candle.get("s") != "ok":
            return None
        closes = candle.get("c") or []
        if len(closes) < 2 or closes[0] == 0:
            return None
        return cast(float, (closes[-1] - closes[0]) / closes[0])

    async def _hot_stock(self, ticker: str, low: float, high: float) -> HotStock | None:
        change = await self._one_year_change(ticker)
        if change is None or not (low <= change <= high):
            return None
        profile = await self._get("/stock/profile2", symbol=ticker)
        quote = await self._get("/quote", symbol=ticker)
        price = quote.get("c")
        if not price:
            return None
        return HotStock(
            ticker=ticker,
            name=profile.get("name") or ticker,
            price=float(price),
            one_year_change_pct=change,
            sector=profile.get("finnhubIndustry") or "Unknown",
        )

    async def screen_hot_stocks(self, low: float = 0.50, high: float = 1.00) -> list[HotStock]:
        sem = asyncio.Semaphore(_SCREEN_CONCURRENCY)

        async def bounded(ticker: str) -> HotStock | None:
            async with sem:
                return await self._hot_stock(ticker, low, high)

        results = await asyncio.gather(*(bounded(t) for t in SP500_CANDIDATES))
        hits = [r for r in results if r is not None]
        hits.sort(key=lambda h: h.one_year_change_pct, reverse=True)
        return hits

    async def get_quote(self, ticker: str) -> TickerDetail:
        ticker = ticker.upper()
        profile = await self._get("/stock/profile2", symbol=ticker)
        quote = await self._get("/quote", symbol=ticker)
        price = quote.get("c")
        if not profile or not price:
            raise AppError(f"Unknown ticker: {ticker}", type="not_found", status=404)
        change = await self._one_year_change(ticker)
        return TickerDetail(
            ticker=ticker,
            name=profile.get("name") or ticker,
            price=float(price),
            one_year_change_pct=change if change is not None else 0.0,
            sector=profile.get("finnhubIndustry") or "Unknown",
            currency=profile.get("currency") or "USD",
        )

    async def get_universe(self) -> set[str]:
        return set(SP500_CANDIDATES)

    async def aclose(self) -> None:
        await self._client.aclose()
