"""KOL routes: scan persists state; scoreboard read works without Claude."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.deps import get_kol_engine, get_stock_provider
from app.main import create_app
from app.providers.mock import MockStockDataProvider
from app.schemas import KolCall, KolPost
from app.services.kol_engine import post_id, reprice_calls
from app.store.kol_store import KolStore
from app.store.portfolio_store import PortfolioStore


class _StubKolEngine:
    """Deterministic stand-in for the Claude-backed scan."""

    def __init__(self) -> None:
        self._provider = MockStockDataProvider()

    async def scan(
        self, *, handle: str, known_posts: list[KolPost]
    ) -> tuple[str, list[KolPost], list[KolCall]]:
        known_ids = {p.id for p in known_posts}
        posts = [
            p
            for p in [
                KolPost(
                    id=post_id(handle, "Locked in +40% on NVDA", "2026-07-14"),
                    handle=handle,
                    date="2026-07-14",
                    url=None,
                    excerpt="Locked in +40% on NVDA",
                    post_type="pnl_boast",
                    claimed_result="gain",
                    tickers=["NVDA"],
                )
            ]
            if p.id not in known_ids  # same dedupe rule as the real engine
        ]
        calls = [
            KolCall(
                id=post_id(handle, "call|AMD|long", "2026-07-14"),
                handle=handle,
                ticker="AMD",
                direction="long",
                date="2026-07-14",
                source_excerpt="Long AMD",
                entry_price=0.0,
            )
        ]
        return "几乎只晒赚。", posts, calls

    async def freeze_new_calls(
        self, raw_calls: list[KolCall], existing: list[KolCall]
    ) -> list[KolCall]:
        known = {c.id for c in existing}
        out = []
        for call in raw_calls:
            if call.id in known:
                continue
            quote = await self._provider.get_quote(call.ticker)
            call.entry_price = quote.price
            out.append(call)
        return out

    async def reprice_calls(self, calls: list[KolCall]) -> list[KolCall]:
        return await reprice_calls(self._provider, calls)


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    app = create_app()
    provider = MockStockDataProvider()
    app.dependency_overrides[get_stock_provider] = lambda: provider
    app.dependency_overrides[get_kol_engine] = lambda: _StubKolEngine()
    app.state.stock_provider = provider
    app.state.raw_primary = provider
    app.state.stock_is_real = False
    app.state.portfolio_store = PortfolioStore(tmp_path / "portfolio.json")
    app.state.kol_store = KolStore(tmp_path / "kol.json")
    return TestClient(app)


def test_get_before_first_scan_is_empty_but_200(client: TestClient) -> None:
    resp = client.get("/api/kol")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1  # default KOL_HANDLES=serenity
    assert body[0]["handle"] == "serenity"
    assert body[0]["scoreboard"]["postsAnalyzed"] == 0


def test_scan_persists_and_scores(client: TestClient) -> None:
    resp = client.post("/api/kol/run")
    assert resp.status_code == 200
    report = resp.json()[0]
    assert report["summary"] == "几乎只晒赚。"
    assert report["scoreboard"]["gainPosts"] == 1
    assert report["scoreboard"]["boastGainRatio"] == 1.0
    call = report["calls"][0]
    assert call["entryPrice"] == 168.20  # frozen from provider, not from claims
    assert call["returnPct"] == 0.0  # repriced same seed price

    # A rerun dedupes: still exactly one post / one call.
    resp = client.post("/api/kol/run")
    report = resp.json()[0]
    assert report["scoreboard"]["postsAnalyzed"] == 1
    assert report["scoreboard"]["callsTracked"] == 1

    # GET (no Claude) serves the persisted state repriced.
    resp = client.get("/api/kol")
    assert resp.json()[0]["scoreboard"]["postsAnalyzed"] == 1
