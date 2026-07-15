"""Portfolio + trends routes via TestClient (mock provider, tmp JSON store)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

import app.routers.portfolio as portfolio_router
from app.config import Settings
from app.deps import get_research_engine, get_stock_provider
from app.main import create_app
from app.providers.mock import MockStockDataProvider
from app.schemas import HoldingNote, PortfolioPosition, ResearchReport
from app.store.portfolio_store import PortfolioStore


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    app = create_app()
    provider = MockStockDataProvider()
    app.dependency_overrides[get_stock_provider] = lambda: provider
    # Provide app.state bits normally set by lifespan (lifespan isn't run here).
    app.state.stock_provider = provider
    app.state.raw_primary = provider
    app.state.stock_is_real = False
    app.state.portfolio_store = PortfolioStore(tmp_path / "portfolio.json")
    return TestClient(app)


def test_add_position_freezes_provider_entry_price(client: TestClient) -> None:
    resp = client.post(
        "/api/portfolio/positions",
        json={"ticker": "nvda", "trend": "AI 平台迁移", "thesis": "AI compute buildout"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["ticker"] == "NVDA"
    assert body["entryPrice"] == 178.34  # provider seed price, camelCase wire
    assert body["shares"] == 1.0  # default position size
    assert body["trend"] == "AI 平台迁移"


def test_add_position_with_manual_fill(client: TestClient) -> None:
    resp = client.post(
        "/api/portfolio/positions",
        json={"ticker": "NVDA", "shares": 25, "entryPrice": 95.5, "entryDate": "2025-11-03"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["entryPrice"] == 95.5  # the real fill, not today's price
    assert body["entryDate"] == "2025-11-03"
    assert body["shares"] == 25


def test_add_position_rejects_bad_manual_values(client: TestClient) -> None:
    bad_shares = client.post("/api/portfolio/positions", json={"ticker": "NVDA", "shares": 0})
    assert bad_shares.status_code == 422
    bad_price = client.post(
        "/api/portfolio/positions", json={"ticker": "NVDA", "entryPrice": -1}
    )
    assert bad_price.status_code == 422
    bad_date = client.post(
        "/api/portfolio/positions", json={"ticker": "NVDA", "entryDate": "03/11/2025"}
    )
    assert bad_date.status_code == 422


def test_update_position(client: TestClient) -> None:
    client.post("/api/portfolio/positions", json={"ticker": "NVDA"})
    resp = client.patch(
        "/api/portfolio/positions/nvda",
        json={"shares": 40, "entryPrice": 110.0, "trend": "AI 平台迁移"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["shares"] == 40
    assert body["entryPrice"] == 110.0
    assert body["trend"] == "AI 平台迁移"

    # Partial edit leaves other fields alone; empty string clears a tag.
    resp = client.patch("/api/portfolio/positions/NVDA", json={"trend": ""})
    assert resp.json()["trend"] is None
    assert resp.json()["shares"] == 40

    assert client.patch("/api/portfolio/positions/NVDA", json={}).status_code == 422
    assert client.patch("/api/portfolio/positions/NVDA", json={"shares": -1}).status_code == 422
    assert (
        client.patch("/api/portfolio/positions/GONE", json={"shares": 1}).status_code == 404
    )


def test_add_duplicate_conflicts(client: TestClient) -> None:
    client.post("/api/portfolio/positions", json={"ticker": "NVDA"})
    resp = client.post("/api/portfolio/positions", json={"ticker": "NVDA"})
    assert resp.status_code == 409
    assert resp.json()["error"]["type"] == "conflict"


def test_add_unknown_ticker_404(client: TestClient) -> None:
    resp = client.post("/api/portfolio/positions", json={"ticker": "NOPE"})
    assert resp.status_code == 404


def test_portfolio_view_value_weights_totals_and_alerts(client: TestClient) -> None:
    client.post("/api/portfolio/positions", json={"ticker": "NVDA", "trend": "AI 平台迁移"})
    client.post("/api/portfolio/positions", json={"ticker": "AMD", "trend": "AI 平台迁移"})
    client.post("/api/portfolio/positions", json={"ticker": "ETN"})  # untagged

    resp = client.get("/api/portfolio")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["holdings"]) == 3
    nvda = next(h for h in body["holdings"] if h["ticker"] == "NVDA")
    assert nvda["currentPrice"] == 178.34
    assert nvda["sinceEntryPct"] == 0.0  # added just now at the same price
    assert nvda["marketValue"] == pytest.approx(178.34)  # 1 share

    total = 178.34 + 168.20 + 372.40  # seed prices, 1 share each
    assert body["totalValue"] == pytest.approx(total)
    assert body["totalCost"] == pytest.approx(total)
    assert body["totalPnl"] == pytest.approx(0.0)

    slices = {s["trend"]: s for s in body["trendSlices"]}
    # Value-weighted, not count-weighted.
    assert slices["AI 平台迁移"]["weightPct"] == pytest.approx((178.34 + 168.20) / total)
    assert slices["未分类"]["tickers"] == ["ETN"]
    assert "not financial advice" in body["disclaimer"].lower()

    # Manager guardrails: ETN alone is ~37% of value -> concentration warning,
    # plus the "no research yet" info nudge.
    warnings = [a["message"] for a in body["alerts"] if a["level"] == "warning"]
    assert any("ETN" in m for m in warnings)
    assert any(a["level"] == "info" and "研究" in a["message"] for a in body["alerts"])


def test_remove_position(client: TestClient) -> None:
    client.post("/api/portfolio/positions", json={"ticker": "NVDA"})
    assert client.delete("/api/portfolio/positions/nvda").status_code == 200
    assert client.delete("/api/portfolio/positions/NVDA").status_code == 404


def test_research_404_before_first_run(client: TestClient) -> None:
    resp = client.get("/api/portfolio/research")
    assert resp.status_code == 404


def test_research_run_without_key_is_503(client: TestClient) -> None:
    # No ANTHROPIC_API_KEY in the test env -> the engine dep must refuse
    # honestly instead of fabricating research.
    resp = client.post("/api/portfolio/research/run")
    assert resp.status_code == 503
    assert resp.json()["error"]["type"] == "not_configured"


def test_trends_seeds_ai_anchor(client: TestClient) -> None:
    resp = client.get("/api/trends")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["name"] == "AI 平台迁移"
    assert body[0]["thesis"]  # ready to feed POST /api/tiers/thesis


def test_trend_discover_without_key_is_503(client: TestClient) -> None:
    resp = client.post("/api/trends/discover")
    assert resp.status_code == 503


class _StubResearchEngine:
    def __init__(self) -> None:
        self.ran_with: list[PortfolioPosition] | None = None

    async def run(self, positions: list[PortfolioPosition]) -> ResearchReport:
        self.ran_with = positions
        return ResearchReport(
            summary="组合稳定。",
            notes=[
                HoldingNote(
                    ticker="NVDA",
                    headline="需求强劲",
                    thesis_status="intact",
                    note="订单持续。",
                )
            ],
            diversification="AI 占比高。",
            generated_at="2026-07-04T00:00:00+00:00",
            disclaimer="This is not financial advice.",
        )


def test_research_run_persists_report(client: TestClient) -> None:
    stub = _StubResearchEngine()
    client.app.dependency_overrides[get_research_engine] = lambda: stub  # type: ignore[union-attr]
    client.post("/api/portfolio/positions", json={"ticker": "NVDA"})

    resp = client.post("/api/portfolio/research/run")
    assert resp.status_code == 200
    assert resp.json()["summary"] == "组合稳定。"
    assert stub.ran_with is not None and stub.ran_with[0].ticker == "NVDA"

    # The report is stored: GET now returns it.
    resp = client.get("/api/portfolio/research")
    assert resp.status_code == 200
    assert resp.json()["notes"][0]["thesisStatus"] == "intact"


def test_research_run_enforces_cron_secret(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    stub = _StubResearchEngine()
    client.app.dependency_overrides[get_research_engine] = lambda: stub  # type: ignore[union-attr]
    client.post("/api/portfolio/positions", json={"ticker": "NVDA"})

    def _settings_with_secret() -> Any:
        return Settings(stock_provider="mock", cron_secret="s3cret")

    monkeypatch.setattr(portfolio_router, "get_settings", _settings_with_secret)

    assert client.post("/api/portfolio/research/run").status_code == 401
    wrong = client.post("/api/portfolio/research/run", headers={"x-cron-secret": "nope"})
    assert wrong.status_code == 401
    ok = client.post("/api/portfolio/research/run", headers={"x-cron-secret": "s3cret"})
    assert ok.status_code == 200
