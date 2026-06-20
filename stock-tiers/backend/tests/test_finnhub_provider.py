"""FinnhubStockDataProvider against a mocked httpx transport (offline)."""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse

import httpx
import pytest

from app.errors import AppError
from app.providers.base import ProviderError
from app.providers.finnhub import FinnhubStockDataProvider

# Fixture data: ticker -> (1yr % return, price, name, sector)
_DATA = {
    "NVDA": (74.0, 178.34, "NVIDIA Corporation", "Semiconductors"),
    "AMD": (58.0, 168.20, "Advanced Micro Devices", "Semiconductors"),
    "INTC": (12.0, 24.10, "Intel Corporation", "Semiconductors"),  # below band
}


def _handler(request: httpx.Request) -> httpx.Response:
    path = urlparse(str(request.url)).path
    symbol = parse_qs(request.url.query.decode())["symbol"][0]
    row = _DATA.get(symbol)
    if row is None:
        # Unknown symbol: Finnhub returns empty objects, not errors.
        if path.endswith("/quote"):
            return httpx.Response(200, json={"c": 0})
        return httpx.Response(200, json={})
    change, price, name, sector = row
    if path.endswith("/stock/metric"):
        return httpx.Response(200, json={"metric": {"52WeekPriceReturnDaily": change}})
    if path.endswith("/quote"):
        return httpx.Response(200, json={"c": price})
    if path.endswith("/stock/profile2"):
        return httpx.Response(
            200, json={"name": name, "finnhubIndustry": sector, "currency": "USD"}
        )
    return httpx.Response(404, json={})


def _provider(handler=_handler, candidates=("NVDA", "AMD", "INTC")) -> FinnhubStockDataProvider:
    p = FinnhubStockDataProvider("test-key", candidate_limit=10)
    p._client = httpx.AsyncClient(
        base_url="https://finnhub.io/api/v1",
        transport=httpx.MockTransport(handler),
    )
    p._candidates = tuple(candidates)  # type: ignore[assignment]
    return p


async def test_one_year_change_from_metric() -> None:
    p = _provider()
    assert await p._one_year_change("NVDA") == pytest.approx(0.74)


async def test_quote_enriches_from_quote_and_profile() -> None:
    p = _provider()
    detail = await p.get_quote("nvda")
    assert detail.ticker == "NVDA"
    assert detail.price == 178.34
    assert detail.one_year_change_pct == pytest.approx(0.74)
    assert detail.sector == "Semiconductors"
    assert detail.currency == "USD"


async def test_unknown_ticker_raises_404() -> None:
    p = _provider()
    with pytest.raises(AppError) as exc:
        await p.get_quote("ZZZZ")
    assert exc.value.status == 404


async def test_screener_filters_to_band_and_sorts() -> None:
    p = _provider()
    hits = await p.screen_hot_stocks(0.50, 1.00)
    tickers = [h.ticker for h in hits]
    assert tickers == ["NVDA", "AMD"]  # INTC (12%) excluded; sorted desc
    assert all(0.50 <= h.one_year_change_pct <= 1.00 for h in hits)


async def test_screener_is_metric_first() -> None:
    # quote/profile must be fetched ONLY for band survivors, not every candidate.
    calls: list[str] = []

    def counting_handler(request: httpx.Request) -> httpx.Response:
        calls.append(urlparse(str(request.url)).path.rsplit("/", 1)[-1])
        return _handler(request)

    p = _provider(handler=counting_handler)
    await p.screen_hot_stocks(0.50, 1.00)
    # 3 candidates -> 3 metric calls; only the 2 survivors get quote+profile.
    assert calls.count("metric") == 3
    assert calls.count("quote") == 2
    assert calls.count("profile2") == 2


async def test_get_wraps_http_error_as_provider_error() -> None:
    def boom(_: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"error": "premium only"})

    p = _provider(handler=boom)
    with pytest.raises(ProviderError):
        await p._get("/quote", symbol="NVDA")


async def test_one_year_change_is_best_effort_on_error() -> None:
    # A flaky/forbidden metric call returns None (not raise), so it never drops
    # an otherwise-priceable ticker.
    def boom(_: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"error": "premium only"})

    p = _provider(handler=boom)
    assert await p._one_year_change("NVDA") is None


async def test_universe_is_candidate_set() -> None:
    p = _provider(candidates=("NVDA", "AMD"))
    assert await p.get_universe() == {"NVDA", "AMD"}
