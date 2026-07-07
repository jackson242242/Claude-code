"""Spotify episode scanner: opt-in config, recency filter, resilience."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

import httpx

from app.config import Settings
from app.services.podcast_scanner import PodcastScanner

_TODAY = datetime.now(UTC).date().isoformat()
_OLD = (datetime.now(UTC) - timedelta(days=30)).date().isoformat()


def _transport() -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/token":
            return httpx.Response(200, json={"access_token": "tok"})
        if request.url.path == "/v1/search":
            return httpx.Response(
                200, json={"shows": {"items": [{"id": "show1", "name": "BG2 Pod"}]}}
            )
        if request.url.path == "/v1/shows/show1/episodes":
            return httpx.Response(
                200,
                json={
                    "items": [
                        {
                            "name": "AI capex special",
                            "release_date": _TODAY,
                            "description": "Guests discuss datacenter power.",
                        },
                        {
                            "name": "old episode",
                            "release_date": _OLD,
                            "description": "stale",
                        },
                    ]
                },
            )
        return httpx.Response(404, json={})

    return httpx.MockTransport(handler)


def _settings(**kwargs: object) -> Settings:
    return Settings(stock_provider="mock", podcast_shows="BG2 Pod", **kwargs)  # type: ignore[arg-type]


async def test_unconfigured_returns_empty() -> None:
    scanner = PodcastScanner(_settings())
    assert scanner.configured() is False
    assert await scanner.fetch_recent_episodes() == []


async def test_fetches_only_recent_episodes() -> None:
    settings = _settings(spotify_client_id="id", spotify_client_secret="secret")
    scanner = PodcastScanner(settings, client=httpx.AsyncClient(transport=_transport()))
    lines = await scanner.fetch_recent_episodes(days=2)
    assert len(lines) == 1
    assert "BG2 Pod — AI capex special" in lines[0]
    assert "datacenter power" in lines[0]


async def test_api_failure_degrades_to_empty() -> None:
    def boom(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text=json.dumps({"error": "down"}))

    settings = _settings(spotify_client_id="id", spotify_client_secret="secret")
    scanner = PodcastScanner(
        settings, client=httpx.AsyncClient(transport=httpx.MockTransport(boom))
    )
    assert await scanner.fetch_recent_episodes() == []
