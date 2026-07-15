"""Band-boundary behavior of the screener filter."""

from __future__ import annotations

import pytest

from app.providers.base import StockDataProvider
from app.providers.mock import MockStockDataProvider
from app.schemas import HotStock


class _BoundaryProvider(MockStockDataProvider):
    """Override the universe with crafted boundary values."""

    _ROWS = {
        "OUTLOW": 0.499,
        "ATLOW": 0.50,
        "MID": 0.75,
        "ATHIGH": 1.00,
        "OUTHIGH": 1.001,
    }

    async def screen_hot_stocks(self, low: float = 0.50, high: float = 1.00) -> list[HotStock]:
        return [
            HotStock(ticker=t, name=t, price=10.0, one_year_change_pct=c, sector="Test")
            for t, c in self._ROWS.items()
            if low <= c <= high
        ]


@pytest.fixture
def boundary_provider() -> StockDataProvider:
    return _BoundaryProvider()


async def test_default_band_includes_endpoints_excludes_outside(
    boundary_provider: StockDataProvider,
) -> None:
    tickers = {h.ticker for h in await boundary_provider.screen_hot_stocks(0.50, 1.00)}
    assert tickers == {"ATLOW", "MID", "ATHIGH"}
    assert "OUTLOW" not in tickers
    assert "OUTHIGH" not in tickers


async def test_custom_band(boundary_provider: StockDataProvider) -> None:
    tickers = {h.ticker for h in await boundary_provider.screen_hot_stocks(0.70, 0.80)}
    assert tickers == {"MID"}
