"""KOL engine: dedupe, entry-price freezing, direction-adjusted returns,
scoreboard math (报喜率 + 实测胜率)."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from app.config import Settings
from app.providers.mock import MockStockDataProvider
from app.schemas import KolCall, KolPost
from app.services.kol_engine import KolEngine, compute_scoreboard, post_id


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
        return SimpleNamespace(content=[_FakeToolUseBlock("emit_kol_scan", self._payload)])


class _FakeAnthropic:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.messages = _FakeMessages(payload)


_PAYLOAD = {
    "summary": "该账号近三天几乎只晒盈利单。",
    "posts": [
        {
            "date": "2026-07-14",
            "url": "https://x.com/serenity/status/1",
            "excerpt": "Locked in +40% on NVDA calls",
            "postType": "pnl_boast",
            "claimedResult": "gain",
            "tickers": ["NVDA"],
        },
        {
            "date": "2026-07-13",
            "url": "",
            "excerpt": "Long AMD here, power move coming",
            "postType": "trade_call",
            "claimedResult": "unknown",
            "tickers": ["AMD"],
        },
        {
            # Already-known post -> deduped.
            "date": "2026-07-12",
            "url": "",
            "excerpt": "old post",
            "postType": "market_view",
            "claimedResult": "neutral",
            "tickers": [],
        },
    ],
    "calls": [
        {"ticker": "AMD", "direction": "long", "date": "2026-07-13", "excerpt": "Long AMD here"},
        {"ticker": "FAKECO", "direction": "long", "date": "2026-07-13", "excerpt": "fake"},
        {"ticker": "NVDA", "direction": "short", "date": "2026-07-14", "excerpt": "short nvda"},
    ],
}


def _engine(payload: dict[str, Any]) -> KolEngine:
    settings = Settings(stock_provider="mock", anthropic_api_key="test")
    return KolEngine(
        client=_FakeAnthropic(payload),  # type: ignore[arg-type]
        provider=MockStockDataProvider(),
        settings=settings,
    )


def _known_post() -> KolPost:
    return KolPost(
        id=post_id("serenity", "old post", "2026-07-12"),
        handle="serenity",
        date="2026-07-12",
        url=None,
        excerpt="old post",
        post_type="market_view",
        claimed_result="neutral",
        tickers=[],
    )


async def test_scan_dedupes_and_classifies() -> None:
    engine = _engine(_PAYLOAD)
    summary, posts, raw_calls = await engine.scan(handle="serenity", known_posts=[_known_post()])
    assert "只晒盈利" in summary
    assert [p.excerpt for p in posts] == [
        "Locked in +40% on NVDA calls",
        "Long AMD here, power move coming",
    ]  # known post deduped
    assert posts[0].claimed_result == "gain"
    assert len(raw_calls) == 3


async def test_freeze_drops_unpriceable_and_freezes_real_price() -> None:
    engine = _engine(_PAYLOAD)
    _, _, raw_calls = await engine.scan(handle="serenity", known_posts=[])
    frozen = await engine.freeze_new_calls(raw_calls, existing=[])
    tickers = {c.ticker for c in frozen}
    assert tickers == {"AMD", "NVDA"}  # FAKECO dropped (unpriceable)
    amd = next(c for c in frozen if c.ticker == "AMD")
    assert amd.entry_price == 168.20  # provider seed price, never the claim


async def test_reprice_direction_adjusted() -> None:
    engine = _engine(_PAYLOAD)
    calls = [
        KolCall(
            id="a",
            handle="serenity",
            ticker="AMD",
            direction="long",
            date="2026-07-01",
            source_excerpt="",
            entry_price=140.0,  # provider now 168.20 -> +20.1% long
        ),
        KolCall(
            id="b",
            handle="serenity",
            ticker="AMD",
            direction="short",
            date="2026-07-01",
            source_excerpt="",
            entry_price=140.0,  # same move -> -20.1% short
        ),
    ]
    repriced = await engine.reprice_calls(calls)
    assert repriced[0].return_pct is not None and repriced[0].return_pct > 0
    assert repriced[1].return_pct is not None and repriced[1].return_pct < 0
    assert abs(repriced[0].return_pct + repriced[1].return_pct) < 1e-9


def test_scoreboard_math() -> None:
    posts = [
        _known_post().model_copy(update={"claimed_result": "gain"}),
        _known_post().model_copy(update={"claimed_result": "gain"}),
        _known_post().model_copy(update={"claimed_result": "gain"}),
        _known_post().model_copy(update={"claimed_result": "loss"}),
        _known_post().model_copy(update={"claimed_result": "neutral"}),
    ]
    calls = [
        KolCall(
            id=str(i),
            handle="serenity",
            ticker="AMD",
            direction="long",
            date="2026-07-01",
            source_excerpt="",
            entry_price=100.0,
            current_price=100.0,
            return_pct=r,
        )
        for i, r in enumerate([0.10, -0.05, 0.20, None])
    ]
    board = compute_scoreboard("serenity", posts, calls)
    assert board.boast_gain_ratio == 0.75  # 3 gains / 4 result-claiming posts
    assert board.calls_tracked == 4
    assert board.wins == 2 and board.losses == 1
    assert board.win_rate is not None and abs(board.win_rate - 2 / 3) < 1e-9
    assert board.avg_return_pct is not None
    assert abs(board.avg_return_pct - (0.10 - 0.05 + 0.20) / 3) < 1e-9
