"""Optional Spotify podcast-episode scanner (free client-credentials flow).

Feeds fresh episode METADATA (show, title, date, description excerpt) into the
daily-brief prompt so Claude knows which episodes dropped and can target its
web searches at them. Honest limitation: Spotify's API exposes metadata only —
no transcripts — so actual quotes are verified via web search (recaps, show
notes, transcript sites) by the brief engine.

Zero-config default: without SPOTIFY_CLIENT_ID/SECRET this returns [] and the
brief engine falls back to searching the major shows directly.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from app.config import Settings

logger = logging.getLogger(__name__)

_TOKEN_URL = "https://accounts.spotify.com/api/token"
_API = "https://api.spotify.com/v1"
_DESC_LIMIT = 300


def _parse_release_date(raw: str) -> datetime | None:
    # Spotify precision varies: YYYY, YYYY-MM, or YYYY-MM-DD.
    try:
        parts = raw.split("-")
        if len(parts) != 3:
            return None
        return datetime(int(parts[0]), int(parts[1]), int(parts[2]), tzinfo=UTC)
    except ValueError:
        return None


class PodcastScanner:
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client or httpx.AsyncClient(timeout=15)

    def configured(self) -> bool:
        return bool(self._settings.spotify_client_id and self._settings.spotify_client_secret)

    async def _token(self) -> str:
        resp = await self._client.post(
            _TOKEN_URL,
            data={"grant_type": "client_credentials"},
            auth=(
                self._settings.spotify_client_id or "",
                self._settings.spotify_client_secret or "",
            ),
        )
        resp.raise_for_status()
        return str(resp.json()["access_token"])

    async def _get(self, token: str, path: str, params: dict[str, Any]) -> dict[str, Any]:
        resp = await self._client.get(
            f"{_API}{path}", params=params, headers={"Authorization": f"Bearer {token}"}
        )
        resp.raise_for_status()
        data: dict[str, Any] = resp.json()
        return data

    async def fetch_recent_episodes(self, *, days: int = 2) -> list[str]:
        """Latest episodes (within `days`) of the configured shows, as prompt
        lines. Best-effort: any failure returns what we have (or [])."""
        if not self.configured():
            return []
        cutoff = datetime.now(UTC) - timedelta(days=days)
        lines: list[str] = []
        try:
            token = await self._token()
            for show_name in self._settings.podcast_show_list():
                try:
                    found = await self._get(
                        token,
                        "/search",
                        {"q": show_name, "type": "show", "limit": 1, "market": "US"},
                    )
                    items = found.get("shows", {}).get("items", [])
                    if not items:
                        continue
                    show = items[0]
                    episodes = await self._get(
                        token, f"/shows/{show['id']}/episodes", {"limit": 3, "market": "US"}
                    )
                    for ep in episodes.get("items", []) or []:
                        if ep is None:
                            continue
                        released = _parse_release_date(str(ep.get("release_date", "")))
                        if released is None or released < cutoff:
                            continue
                        desc = " ".join(str(ep.get("description", "")).split())[:_DESC_LIMIT]
                        lines.append(
                            f"{show.get('name', show_name)} — {ep.get('name', '')} "
                            f"({ep.get('release_date', '')}): {desc}"
                        )
                except httpx.HTTPError:
                    logger.warning("podcast scan failed for show %r", show_name, exc_info=True)
                    continue
        except httpx.HTTPError:
            logger.warning("podcast scan unavailable", exc_info=True)
        return lines
