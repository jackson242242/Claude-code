"""Real market-data provider backed by the Finnhub API (free-tier compatible).

Endpoints used (all available on the free tier):
- GET /quote          -> current price (c)
- GET /stock/profile2 -> name, finnhubIndustry (sector), currency
- GET /stock/metric   -> 52WeekPriceReturnDaily (trailing-1yr % return)

Note: /stock/candle (historical OHLC) is premium-only on Finnhub, so the 1-year
change comes from the free basic-financials metric instead.

Free tier is ~60 calls/min, so every request goes through a provider-wide
semaphore, and the screener is metric-first: it fetches only the cheap metric
per candidate, filters to the band, then fetches quote+profile for survivors.
"""

from __future__ import annotations

import asyncio
from typing import Any, cast

import httpx

from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.providers.sp500 import SP500_CANDIDATES
from app.schemas import HotStock, TickerDetail

_BASE_URL = "https://finnhub.io/api/v1"
_TIMEOUT = 8.0
_MAX_CONCURRENCY = 5  # keep bursts under the ~60/min free-tier limit


class FinnhubStockDataProvider(StockDataProvider):
    def __init__(self, api_key: str, candidate_limit: int = 30) -> None:
        self._client = httpx.AsyncClient(
            base_url=_BASE_URL,
            params={"token": api_key},
            timeout=_TIMEOUT,
        )
        self._candidates = SP500_CANDIDATES[:candidate_limit]
        self._sem = asyncio.Semaphore(_MAX_CONCURRENCY)

    async def _get(self, path: str, **params: str | int) -> dict[str, Any]:
        try:
            async with self._sem:
                resp = await self._client.get(path, params=params)
            resp.raise_for_status()
            return cast(dict[str, Any], resp.json())
        except httpx.HTTPError as exc:  # network, timeout, non-2xx
            raise ProviderError(f"finnhub {path} failed: {exc}") from exc

    async def _one_year_change(self, ticker: str) -> float | None:
        """Trailing-1yr return from the free basic-financials metric (a percent).

        Best-effort: on any upstream error return None rather than raising, so a
        flaky metric call doesn't drop an otherwise-priceable ticker.
        """
        try:
            data = await self._get("/stock/metric", symbol=ticker, metric="all")
        except ProviderError:
            return None
        metric = data.get("metric") or {}
        raw = metric.get("52WeekPriceReturnDaily")
        if raw is None:
            return None
        try:
            return float(raw) / 100.0
        except (TypeError, ValueError):
            return None

    async def _detail(self, ticker: str, change: float | None) -> TickerDetail | None:
        profile = await self._get("/stock/profile2", symbol=ticker)
        quote = await self._get("/quote", symbol=ticker)
        price = quote.get("c")
        if not profile or not price:
            return None
        return TickerDetail(
            ticker=ticker,
            name=profile.get("name") or ticker,
            price=float(price),
            one_year_change_pct=change if change is not None else 0.0,
            sector=profile.get("finnhubIndustry") or "Unknown",
            currency=profile.get("currency") or "USD",
        )

    async def screen_hot_stocks(self, low: float = 0.50, high: float = 1.00) -> list[HotStock]:
        # Metric-first: cheap 1-call screen, then quote+profile only for survivors.
        async def change_of(ticker: str) -> tuple[str, float] | None:
            change = await self._one_year_change(ticker)
            if change is None or not (low <= change <= high):
                return None
            return ticker, change

        screened = await asyncio.gather(*(change_of(t) for t in self._candidates))
        survivors = [s for s in screened if s is not None]

        async def to_hot(ticker: str, change: float) -> HotStock | None:
            detail = await self._detail(ticker, change)
            if detail is None:
                return None
            return HotStock(
                ticker=detail.ticker,
                name=detail.name,
                price=detail.price,
                one_year_change_pct=change,
                sector=detail.sector,
            )

        enriched = await asyncio.gather(*(to_hot(t, c) for t, c in survivors))
        hits = [h for h in enriched if h is not None]
        hits.sort(key=lambda h: h.one_year_change_pct, reverse=True)
        return hits

    async def get_quote(self, ticker: str) -> TickerDetail:
        ticker = ticker.upper()
        change = await self._one_year_change(ticker)
        detail = await self._detail(ticker, change)
        if detail is None:
            raise AppError(f"Unknown ticker: {ticker}", type="not_found", status=404)
        return detail

    async def get_universe(self) -> set[str]:
        return set(self._candidates)

    async def aclose(self) -> None:
        await self._client.aclose()
