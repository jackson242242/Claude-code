"""Brief routes: run/store/serve/RSS with a stubbed engine + stubbed TTS."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import app.routers.briefs as briefs_router
from app.deps import get_brief_engine, get_stock_provider
from app.main import create_app
from app.providers.mock import MockStockDataProvider
from app.schemas import DISCLAIMER, BriefHighlight, DailyBrief, SwingThesis
from app.store.brief_store import BriefStore
from app.store.portfolio_store import PortfolioStore

_TODAY = datetime.now(UTC).date().isoformat()


def _brief(brief_id: str = _TODAY) -> DailyBrief:
    return DailyBrief(
        id=brief_id,
        title="7月7日:关税与算力",
        date=brief_id,
        script="今天是七月七号。……内容仅供研究参考。",
        highlights=[BriefHighlight(topic="股市", headline="半导体领涨", detail="……")],
        swing_theses=[
            SwingThesis(name="电力设备", thesis="电网订单加速", horizon="short", why_now="指引上调")
        ],
        audio_url=None,
        generated_at=datetime.now(UTC).isoformat(),
        disclaimer=DISCLAIMER,
    )


class _StubBriefEngine:
    async def generate(self, **_: object) -> DailyBrief:
        return _brief()


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    app = create_app()
    provider = MockStockDataProvider()
    app.dependency_overrides[get_stock_provider] = lambda: provider
    app.dependency_overrides[get_brief_engine] = lambda: _StubBriefEngine()
    app.state.stock_provider = provider
    app.state.raw_primary = provider
    app.state.stock_is_real = False
    app.state.portfolio_store = PortfolioStore(tmp_path / "portfolio.json")
    app.state.brief_store = BriefStore(tmp_path / "briefs", keep=3)

    # Stub TTS: write a tiny fake mp3 (edge-tts needs network; success path only).
    async def fake_tts(text: str, *, voice: str, out_path: Path) -> bool:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(b"ID3fakeaudio")
        return True

    monkeypatch.setattr(briefs_router, "synthesize_to_mp3", fake_tts)
    return TestClient(app)


def test_run_generates_stores_and_attaches_audio(client: TestClient) -> None:
    resp = client.post("/api/briefs/run")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == _TODAY
    assert body["audioUrl"] == f"/api/briefs/audio/brief-{_TODAY}.mp3"
    assert body["swingTheses"][0]["thesis"] == "电网订单加速"

    latest = client.get("/api/briefs/latest")
    assert latest.status_code == 200
    assert latest.json()["title"] == "7月7日:关税与算力"

    listing = client.get("/api/briefs")
    assert [b["id"] for b in listing.json()] == [_TODAY]


def test_audio_served_after_run(client: TestClient) -> None:
    client.post("/api/briefs/run")
    resp = client.get(f"/api/briefs/audio/brief-{_TODAY}.mp3")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/mpeg"
    assert resp.content.startswith(b"ID3")


def test_audio_404_for_unknown_brief(client: TestClient) -> None:
    assert client.get("/api/briefs/audio/brief-2020-01-01.mp3").status_code == 404


def test_latest_404_before_first_run(client: TestClient) -> None:
    assert client.get("/api/briefs/latest").status_code == 404


def test_tts_failure_ships_text_only_brief(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def failing_tts(text: str, *, voice: str, out_path: Path) -> bool:
        return False

    monkeypatch.setattr(briefs_router, "synthesize_to_mp3", failing_tts)
    resp = client.post("/api/briefs/run")
    assert resp.status_code == 200
    assert resp.json()["audioUrl"] is None  # degraded, not failed


def test_podcast_feed_lists_audio_briefs(client: TestClient) -> None:
    client.post("/api/briefs/run")
    resp = client.get("/podcast.xml")
    assert resp.status_code == 200
    assert "rss" in resp.headers["content-type"]
    xml = resp.text
    assert "<rss" in xml and "每日投资简报" in xml
    assert f"/api/briefs/audio/brief-{_TODAY}.mp3" in xml
    assert 'type="audio/mpeg"' in xml
