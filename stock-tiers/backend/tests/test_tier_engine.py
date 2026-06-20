"""Tier engine: structured-output parsing, anti-hallucination, caching."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

import pytest

from app.config import Settings
from app.providers.mock import MockStockDataProvider
from app.schemas import TIER_ORDER
from app.services.tier_cache import TierCache
from app.services.tier_engine import TierEngine


class _FakeToolUseBlock:
    def __init__(self, name: str, payload: dict[str, Any]) -> None:
        self.type = "tool_use"
        self.name = name
        self.input = payload


class _FakeMessages:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload
        self.calls = 0

    async def create(self, **_: Any) -> SimpleNamespace:
        self.calls += 1
        block = _FakeToolUseBlock("emit_tier_list", self._payload)
        return SimpleNamespace(content=[block])


class _FakeAnthropic:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.messages = _FakeMessages(payload)


_PAYLOAD = {
    "thesis": "AI compute buildout.",
    "entries": [
        {
            "ticker": "AMD",
            "tier": "S",
            "relationship": "alternative",
            "rationale": "Direct GPU competitor.",
            "tierJustification": "Strongest alternative.",
            # LLM-supplied price that must be IGNORED in favor of provider data.
            "price": 999.0,
            "oneYearChangePct": 9.99,
        },
        {
            "ticker": "VRT",
            "tier": "A",
            "relationship": "downstream",
            "rationale": "Datacenter cooling/power.",
            "tierJustification": "Clear beneficiary.",
        },
        {
            # Bogus / off-universe ticker -> must be dropped (anti-hallucination).
            "ticker": "FAKECO",
            "tier": "B",
            "relationship": "alternative",
            "rationale": "n/a",
            "tierJustification": "n/a",
        },
        {
            # The hot stock itself -> must be excluded.
            "ticker": "NVDA",
            "tier": "S",
            "relationship": "alternative",
            "rationale": "self",
            "tierJustification": "self",
        },
    ],
}


@pytest.fixture
def settings() -> Settings:
    return Settings(stock_provider="mock", anthropic_api_key="test", tier_model="claude-opus-4-8")


@pytest.fixture
def engine(settings: Settings) -> TierEngine:
    return TierEngine(
        client=_FakeAnthropic(_PAYLOAD),  # type: ignore[arg-type]
        provider=MockStockDataProvider(),
        cache=TierCache(ttl=settings.tier_cache_ttl),
        settings=settings,
    )


async def test_generate_drops_bogus_and_self_keeps_valid(engine: TierEngine) -> None:
    result = await engine.generate("NVDA")
    all_entries = [e for bucket in result.tiers.values() for e in bucket]
    tickers = {e.ticker for e in all_entries}
    assert tickers == {"AMD", "VRT"}
    assert "FAKECO" not in tickers  # hallucinated ticker dropped
    assert "NVDA" not in tickers  # hot stock excluded


async def test_prices_come_from_provider_not_llm(engine: TierEngine) -> None:
    result = await engine.generate("NVDA")
    amd = next(e for bucket in result.tiers.values() for e in bucket if e.ticker == "AMD")
    assert amd.price == 168.20  # seed value, not the LLM's 999.0
    assert amd.one_year_change_pct == 0.58  # seed value, not 9.99


async def test_all_six_tiers_present(engine: TierEngine) -> None:
    result = await engine.generate("NVDA")
    assert set(result.tiers.keys()) == set(TIER_ORDER)


async def test_disclaimer_and_thesis_attached(engine: TierEngine) -> None:
    result = await engine.generate("NVDA")
    assert "not financial advice" in result.disclaimer.lower()
    assert result.thesis == "AI compute buildout."


async def test_second_call_is_cache_hit(engine: TierEngine) -> None:
    await engine.generate("NVDA")
    await engine.generate("NVDA")
    assert engine._client.messages.calls == 1  # type: ignore[attr-defined]


async def test_generate_from_thesis(engine: TierEngine) -> None:
    result = await engine.generate_from_thesis("AI compute buildout", "long")
    assert result.hot_stock_ticker is None  # thesis mode has no hot stock
    tickers = {e.ticker for bucket in result.tiers.values() for e in bucket}
    assert tickers  # populated
    assert "FAKECO" not in tickers  # bogus ticker still dropped
    assert "not financial advice" in result.disclaimer.lower()


async def test_thesis_second_call_is_cache_hit(engine: TierEngine) -> None:
    await engine.generate_from_thesis("AI compute buildout", "long")
    await engine.generate_from_thesis("AI compute buildout", "long")
    assert engine._client.messages.calls == 1  # type: ignore[attr-defined]
