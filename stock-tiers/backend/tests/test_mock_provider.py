"""Mock provider determinism and quote behavior."""

from __future__ import annotations

import pytest

from app.errors import AppError
from app.providers.mock import MockStockDataProvider
from app.providers.seed_data import SEED_BY_TICKER


async def test_screen_returns_only_band_members(mock_provider: MockStockDataProvider) -> None:
    hits = await mock_provider.screen_hot_stocks(0.50, 1.00)
    assert hits, "expected seeded hot stocks in the +50-100% band"
    for h in hits:
        assert 0.50 <= h.one_year_change_pct <= 1.00


async def test_screen_is_sorted_desc(mock_provider: MockStockDataProvider) -> None:
    hits = await mock_provider.screen_hot_stocks()
    changes = [h.one_year_change_pct for h in hits]
    assert changes == sorted(changes, reverse=True)


async def test_screen_is_deterministic(mock_provider: MockStockDataProvider) -> None:
    first = await mock_provider.screen_hot_stocks()
    second = await mock_provider.screen_hot_stocks()
    assert [h.ticker for h in first] == [h.ticker for h in second]


async def test_known_quote(mock_provider: MockStockDataProvider) -> None:
    detail = await mock_provider.get_quote("nvda")  # case-insensitive
    seed = SEED_BY_TICKER["NVDA"]
    assert detail.ticker == "NVDA"
    assert detail.price == seed.price
    assert detail.one_year_change_pct == seed.one_year_change_pct
    assert detail.currency == "USD"


async def test_unknown_quote_raises_404(mock_provider: MockStockDataProvider) -> None:
    with pytest.raises(AppError) as exc:
        await mock_provider.get_quote("NOPE")
    assert exc.value.status == 404
    assert exc.value.type == "not_found"


async def test_universe_matches_seed(mock_provider: MockStockDataProvider) -> None:
    universe = await mock_provider.get_universe()
    assert universe == set(SEED_BY_TICKER.keys())
