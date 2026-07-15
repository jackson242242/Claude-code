"""Daily research engine: note validation, enrichment, empty-portfolio guard."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

import pytest

from app.config import Settings
from app.errors import AppError
from app.providers.mock import MockStockDataProvider
from app.schemas import PortfolioPosition
from app.services.research_engine import ResearchEngine, enrich_position


class _FakeToolUseBlock:
    def __init__(self, name: str, payload: dict[str, Any]) -> None:
        self.type = "tool_use"
        self.name = name
        self.input = payload


class _FakeMessages:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload
        self.last_kwargs: dict[str, Any] = {}

    async def create(self, **kwargs: Any) -> SimpleNamespace:
        self.last_kwargs = kwargs
        block = _FakeToolUseBlock("emit_research", self._payload)
        return SimpleNamespace(content=[block])


class _FakeAnthropic:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.messages = _FakeMessages(payload)


_PAYLOAD = {
    "summary": "组合整体稳定。",
    "notes": [
        {
            "ticker": "NVDA",
            "headline": "数据中心需求依旧强劲",
            "thesisStatus": "intact",
            "note": "云厂商资本开支继续上调。",
        },
        {
            # Not a holding -> dropped (anti-hallucination).
            "ticker": "FAKECO",
            "headline": "n/a",
            "thesisStatus": "intact",
            "note": "n/a",
        },
        {
            # Duplicate holding note -> dropped.
            "ticker": "NVDA",
            "headline": "重复",
            "thesisStatus": "intact",
            "note": "重复",
        },
        {
            # Invalid status -> dropped.
            "ticker": "AMD",
            "headline": "坏状态",
            "thesisStatus": "moon",
            "note": "n/a",
        },
    ],
    "diversification": "AI 方向占比过高。",
}


def _position(ticker: str, entry_price: float) -> PortfolioPosition:
    return PortfolioPosition(
        ticker=ticker,
        name=f"{ticker} Inc",
        entry_price=entry_price,
        entry_date="2026-06-01",
        trend="AI 平台迁移",
        thesis="AI compute buildout",
        added_at="2026-06-01T00:00:00+00:00",
    )


def _engine(payload: dict[str, Any]) -> ResearchEngine:
    settings = Settings(stock_provider="mock", anthropic_api_key="test")
    return ResearchEngine(
        client=_FakeAnthropic(payload),  # type: ignore[arg-type]
        provider=MockStockDataProvider(),
        settings=settings,
    )


async def test_run_filters_notes_to_actual_holdings() -> None:
    engine = _engine(_PAYLOAD)
    report = await engine.run([_position("NVDA", 100.0), _position("AMD", 150.0)])
    assert report.summary == "组合整体稳定。"
    assert [n.ticker for n in report.notes] == ["NVDA"]  # FAKECO/dupe/bad-status dropped
    assert report.notes[0].thesis_status == "intact"
    assert "not financial advice" in report.disclaimer.lower()
    assert report.generated_at


async def test_run_sends_live_prices_in_prompt() -> None:
    engine = _engine(_PAYLOAD)
    await engine.run([_position("AMD", 100.0)])
    fake = engine._client.messages  # type: ignore[attr-defined]
    user_message = fake.last_kwargs["messages"][0]["content"]
    assert "AMD" in user_message
    assert "$168.20" in user_message  # provider seed price, not a made-up number
    assert "+68% since entry" in user_message  # (168.20 - 100) / 100


async def test_empty_portfolio_rejected() -> None:
    engine = _engine(_PAYLOAD)
    with pytest.raises(AppError) as exc:
        await engine.run([])
    assert exc.value.status == 400
    assert exc.value.type == "empty_portfolio"


async def test_enrich_position_survives_unpriceable_ticker() -> None:
    holding = await enrich_position(MockStockDataProvider(), _position("NOPE", 50.0))
    assert holding.current_price is None
    assert holding.since_entry_pct is None
    assert holding.entry_price == 50.0  # stored data still shown
