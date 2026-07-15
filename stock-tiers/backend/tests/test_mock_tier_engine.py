"""Deterministic mock tier engine — zero-secret full flow."""

from __future__ import annotations

from app.providers.mock import MockStockDataProvider
from app.schemas import TIER_ORDER
from app.services.mock_tier_engine import MockTierEngine


def _engine() -> MockTierEngine:
    return MockTierEngine(MockStockDataProvider())


async def test_generates_all_six_tiers() -> None:
    result = await _engine().generate("NVDA")
    assert set(result.tiers.keys()) == set(TIER_ORDER)


async def test_excludes_hot_stock_and_uses_universe_only() -> None:
    result = await _engine().generate("NVDA")
    tickers = {e.ticker for bucket in result.tiers.values() for e in bucket}
    assert "NVDA" not in tickers
    assert tickers, "expected some alternatives/downstream picks"


async def test_is_deterministic() -> None:
    a = await _engine().generate("NVDA")
    b = await _engine().generate("NVDA")

    def flatten(tl) -> list[tuple[str, str]]:  # type: ignore[no-untyped-def]
        return [(e.ticker, e.tier) for t in TIER_ORDER for e in tl.tiers[t]]

    assert flatten(a) == flatten(b)


async def test_curated_thesis_for_nvda() -> None:
    result = await _engine().generate("NVDA")
    assert "AI compute" in result.thesis


async def test_prices_are_provider_sourced() -> None:
    result = await _engine().generate("NVDA")
    amd = next(
        (e for bucket in result.tiers.values() for e in bucket if e.ticker == "AMD"),
        None,
    )
    assert amd is not None
    assert amd.price == 168.20  # seed value


async def test_disclaimer_attached() -> None:
    result = await _engine().generate("NVDA")
    assert "not financial advice" in result.disclaimer.lower()
