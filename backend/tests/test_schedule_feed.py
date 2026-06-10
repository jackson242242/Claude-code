"""The real-schedule feed overlay: opt-in, cached, and seed-safe on failure."""
from __future__ import annotations

from typing import Any

import httpx
import pytest

from app.config import Settings
from app.seed import schedule_2026 as seed
from app.services import schedule_feed


FEED_URL = "https://feed.test/fifa-world-cup-2026.json"


@pytest.fixture(autouse=True)
def _fresh_cache() -> Any:
    schedule_feed.reset()
    yield
    schedule_feed.reset()


def _enable_feed(monkeypatch: pytest.MonkeyPatch, **overrides: Any) -> None:
    monkeypatch.setattr(
        schedule_feed, "settings", Settings(schedule_feed_url=FEED_URL, **overrides)
    )


def _fake_get(payload: Any, calls: list[str] | None = None):
    def fake_get(url: str, **kwargs: Any) -> httpx.Response:
        if calls is not None:
            calls.append(url)
        return httpx.Response(200, json=payload, request=httpx.Request("GET", url))

    return fake_get


def test_disabled_without_url_returns_seed_unchanged() -> None:
    assert schedule_feed.overlay_matches(seed.MATCHES) is seed.MATCHES


def test_overlay_updates_teams_kickoff_venue_group_and_status(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_feed(monkeypatch)
    payload = [
        {
            "MatchNumber": 1,
            "DateUtc": "2026-06-11 19:00:00Z",
            "Location": "Estadio Azteca",
            "HomeTeam": "Mexico",
            "AwayTeam": "South Africa",
            "Group": "Group A",
            "HomeTeamScore": 2,
            "AwayTeamScore": 1,
        },
        {"MatchNumber": 3, "Location": "Lumen Field"},
    ]
    monkeypatch.setattr(schedule_feed.httpx, "get", _fake_get(payload))

    merged = schedule_feed.overlay_matches(seed.MATCHES)
    opener = merged[0]
    assert opener["match_number"] == 1
    assert opener["away_team"] == "South Africa"
    assert opener["kickoff_utc"] == "2026-06-11T19:00:00.000Z"
    # Mexico City is UTC-6, so local kickoff is recomputed from the feed time.
    assert opener["kickoff_local"] == "2026-06-11T13:00:00"
    assert opener["venue_id"] == "mexico-city"
    assert opener["group"] == "A"
    assert opener["status"] == "completed"
    # A feed location remaps the venue even when nothing else changes.
    assert merged[2]["venue_id"] == "seattle"
    # Untouched matches keep their seed values.
    assert merged[1] == seed.MATCHES[1]


def test_partial_rows_keep_seed_fields(monkeypatch: pytest.MonkeyPatch) -> None:
    _enable_feed(monkeypatch)
    payload = [{"MatchNumber": 2, "HomeTeam": "Canada"}]
    monkeypatch.setattr(schedule_feed.httpx, "get", _fake_get(payload))

    merged = schedule_feed.overlay_matches(seed.MATCHES)
    second = merged[1]
    assert second["home_team"] == "Canada"
    assert second["away_team"] == seed.MATCHES[1]["away_team"]
    assert second["kickoff_utc"] == seed.MATCHES[1]["kickoff_utc"]
    assert second["status"] == "scheduled"


def test_fetch_failure_falls_back_to_seed(monkeypatch: pytest.MonkeyPatch) -> None:
    _enable_feed(monkeypatch)

    def boom(url: str, **kwargs: Any) -> httpx.Response:
        raise httpx.ConnectError("down", request=httpx.Request("GET", url))

    monkeypatch.setattr(schedule_feed.httpx, "get", boom)
    assert schedule_feed.overlay_matches(seed.MATCHES) == seed.MATCHES


def test_malformed_payload_falls_back_to_seed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_feed(monkeypatch)
    monkeypatch.setattr(
        schedule_feed.httpx, "get", _fake_get({"unexpected": "shape"})
    )
    assert schedule_feed.overlay_matches(seed.MATCHES) == seed.MATCHES


def test_feed_is_cached_within_ttl(monkeypatch: pytest.MonkeyPatch) -> None:
    _enable_feed(monkeypatch)
    calls: list[str] = []
    payload = [{"MatchNumber": 1, "HomeTeam": "Mexico", "AwayTeam": "Haiti"}]
    monkeypatch.setattr(schedule_feed.httpx, "get", _fake_get(payload, calls))

    schedule_feed.overlay_matches(seed.MATCHES)
    schedule_feed.overlay_matches(seed.MATCHES)
    assert calls == [FEED_URL]


def test_stale_rows_survive_a_failed_refresh(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_feed(monkeypatch, schedule_feed_ttl_seconds=0.0)
    payload = [{"MatchNumber": 1, "AwayTeam": "Jamaica"}]
    monkeypatch.setattr(schedule_feed.httpx, "get", _fake_get(payload))
    assert schedule_feed.overlay_matches(seed.MATCHES)[0]["away_team"] == "Jamaica"

    def boom(url: str, **kwargs: Any) -> httpx.Response:
        raise httpx.ConnectError("down", request=httpx.Request("GET", url))

    monkeypatch.setattr(schedule_feed.httpx, "get", boom)
    # TTL of zero forces a refresh attempt; the stale rows keep serving.
    assert schedule_feed.overlay_matches(seed.MATCHES)[0]["away_team"] == "Jamaica"


def test_matches_endpoint_serves_overlaid_data(
    monkeypatch: pytest.MonkeyPatch, client: Any
) -> None:
    _enable_feed(monkeypatch)
    payload = [{"MatchNumber": 1, "AwayTeam": "Panama"}]
    monkeypatch.setattr(schedule_feed.httpx, "get", _fake_get(payload))

    response = client.get("/matches")
    assert response.status_code == 200
    opener = next(m for m in response.json() if m["matchNumber"] == 1)
    assert opener["awayTeam"] == "Panama"
