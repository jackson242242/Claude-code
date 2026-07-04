"""JSON-file portfolio store: persistence, dedupe, conflict handling."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.errors import AppError
from app.schemas import HoldingNote, PortfolioPosition, ResearchReport, SecularTrend
from app.store.portfolio_store import PortfolioStore


def _position(ticker: str = "NVDA") -> PortfolioPosition:
    return PortfolioPosition(
        ticker=ticker,
        name=f"{ticker} Inc",
        entry_price=100.0,
        entry_date="2026-07-04",
        trend="AI 平台迁移",
        thesis="AI compute buildout",
        added_at="2026-07-04T00:00:00+00:00",
    )


def _trend(name: str = "电网升级") -> SecularTrend:
    return SecularTrend(
        id="".join(name.split()).casefold(),
        name=name,
        category="能源",
        thesis="电网必须为新增负荷扩容",
        why_now="电力需求多年来首次加速",
        horizon="long",
        discovered_at="2026-07-04T00:00:00+00:00",
    )


async def test_positions_persist_across_instances(tmp_path: Path) -> None:
    path = tmp_path / "portfolio.json"
    store = PortfolioStore(path)
    await store.add_position(_position("NVDA"))
    await store.add_position(_position("AMD"))

    reopened = PortfolioStore(path)  # fresh instance, same file
    positions = await reopened.list_positions()
    assert [p.ticker for p in positions] == ["NVDA", "AMD"]
    assert positions[0].trend == "AI 平台迁移"


async def test_duplicate_position_conflicts(tmp_path: Path) -> None:
    store = PortfolioStore(tmp_path / "p.json")
    await store.add_position(_position("NVDA"))
    with pytest.raises(AppError) as exc:
        await store.add_position(_position("NVDA"))
    assert exc.value.status == 409


async def test_remove_position(tmp_path: Path) -> None:
    store = PortfolioStore(tmp_path / "p.json")
    await store.add_position(_position("NVDA"))
    assert await store.remove_position("nvda") is True  # case-insensitive
    assert await store.remove_position("NVDA") is False  # already gone
    assert await store.list_positions() == []


async def test_trends_dedupe_by_id(tmp_path: Path) -> None:
    store = PortfolioStore(tmp_path / "p.json")
    stored = await store.add_trends([_trend("电网升级")])
    assert len(stored) == 1
    stored = await store.add_trends([_trend("电网升级"), _trend("国防重建")])
    assert [t.name for t in stored] == ["电网升级", "国防重建"]


async def test_research_roundtrip(tmp_path: Path) -> None:
    store = PortfolioStore(tmp_path / "p.json")
    assert await store.get_research() is None
    report = ResearchReport(
        summary="组合整体稳定。",
        notes=[
            HoldingNote(
                ticker="NVDA",
                headline="需求依旧强劲",
                thesis_status="intact",
                note="数据中心订单持续。",
            )
        ],
        diversification="AI 占比过高,可考虑其他方向。",
        generated_at="2026-07-04T00:00:00+00:00",
        disclaimer="not financial advice",
    )
    await store.set_research(report)
    loaded = await PortfolioStore(store._path).get_research()
    assert loaded is not None
    assert loaded.notes[0].thesis_status == "intact"
    assert loaded.summary == "组合整体稳定。"


async def test_corrupt_file_treated_as_empty(tmp_path: Path) -> None:
    path = tmp_path / "p.json"
    path.write_text("{not json", encoding="utf-8")
    store = PortfolioStore(path)
    assert await store.list_positions() == []
    await store.add_position(_position())  # and it recovers to a writable state
    assert len(await store.list_positions()) == 1
