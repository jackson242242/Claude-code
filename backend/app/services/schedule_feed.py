"""Overlay real tournament fixtures onto the generated seed schedule.

The feed is a fixturedownload-style JSON list (``MatchNumber`` / ``DateUtc`` /
``Location`` / ``HomeTeam`` / ``AwayTeam`` / ``Group`` / scores), selected via
``SCHEDULE_FEED_URL``. It is fetched lazily, cached with a TTL (default 6h via
``SCHEDULE_FEED_TTL_SECONDS``), and only ever *overlays* the seed by match
number: fields the feed doesn't provide keep their seed values, and any fetch
or parse failure leaves the seed untouched — the same graceful-degrade
contract as the booking providers. The last good fetch keeps serving (stale
beats absent) while failed refreshes retry on a short interval.
"""
from __future__ import annotations

import threading
import time
from datetime import datetime, timedelta
from typing import Any

import httpx

from app.config import settings
from app.seed.schedule_2026 import CITY_UTC_OFFSET, VENUES

_FAILURE_RETRY_SECONDS = 300.0
_UTC_FORMATS = ("%Y-%m-%d %H:%M:%SZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.000Z")

_lock = threading.Lock()
_rows: dict[int, dict[str, Any]] | None = None
_next_refresh = 0.0
_version = 0


def reset() -> None:
    """Clear cached feed state (used by tests)."""
    global _rows, _next_refresh, _version
    with _lock:
        _rows = None
        _next_refresh = 0.0
        _version += 1


def version() -> int:
    """Monotonic token that changes whenever the overlay data may have changed.

    Triggers the TTL refresh check as a side effect, so callers can cache
    derived data keyed on this value and stay consistent with the feed.
    """
    _feed_rows()
    return _version


def _venue_id_by_name() -> dict[str, str]:
    return {venue["name"].lower(): venue["id"] for venue in VENUES}


def _parse_kickoff_utc(raw: Any) -> str | None:
    if not isinstance(raw, str):
        return None
    for fmt in _UTC_FORMATS:
        try:
            utc_dt = datetime.strptime(raw.strip(), fmt)
        except ValueError:
            continue
        return utc_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return None


def _parse_feed(payload: Any) -> dict[int, dict[str, Any]]:
    if not isinstance(payload, list):
        raise ValueError("schedule feed must be a JSON list of fixtures")
    venues = _venue_id_by_name()
    rows: dict[int, dict[str, Any]] = {}
    for item in payload:
        if not isinstance(item, dict):
            continue
        number = item.get("MatchNumber")
        if not isinstance(number, int):
            continue
        row: dict[str, Any] = {}
        for feed_key, field in (("HomeTeam", "home_team"), ("AwayTeam", "away_team")):
            name = item.get(feed_key)
            if isinstance(name, str) and name.strip():
                row[field] = name.strip()
        kickoff_utc = _parse_kickoff_utc(item.get("DateUtc"))
        if kickoff_utc is not None:
            row["kickoff_utc"] = kickoff_utc
        location = item.get("Location")
        if isinstance(location, str) and location.strip().lower() in venues:
            row["venue_id"] = venues[location.strip().lower()]
        group = item.get("Group")
        if isinstance(group, str) and group.strip():
            row["group"] = group.strip().removeprefix("Group").strip()
        if item.get("HomeTeamScore") is not None and item.get("AwayTeamScore") is not None:
            row["status"] = "completed"
        if row:
            rows[number] = row
    return rows


def _feed_rows() -> dict[int, dict[str, Any]] | None:
    global _rows, _next_refresh, _version
    url = settings.schedule_feed_url
    if not url:
        return None
    with _lock:
        now = time.monotonic()
        if now < _next_refresh:
            return _rows
        try:
            response = httpx.get(
                url,
                timeout=settings.provider_timeout_seconds,
                follow_redirects=True,
            )
            response.raise_for_status()
            _rows = _parse_feed(response.json())
            _next_refresh = now + settings.schedule_feed_ttl_seconds
            _version += 1
        except Exception:
            _next_refresh = now + _FAILURE_RETRY_SECONDS
        return _rows


def _localize(kickoff_utc: str, venue_id: str) -> str:
    utc_dt = datetime.strptime(kickoff_utc, "%Y-%m-%dT%H:%M:%S.000Z")
    offset = CITY_UTC_OFFSET.get(venue_id, 0)
    return (utc_dt + timedelta(hours=offset)).strftime("%Y-%m-%dT%H:%M:%S")


def overlay_matches(matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Merge feed rows onto seed match dicts by match number (seed wins for
    any field the feed didn't provide; no feed → seed passthrough)."""
    rows = _feed_rows()
    if not rows:
        return matches
    merged: list[dict[str, Any]] = []
    for match in matches:
        row = rows.get(match["match_number"])
        if not row:
            merged.append(match)
            continue
        updated = {**match, **row}
        if "kickoff_utc" in row:
            updated["kickoff_local"] = _localize(
                updated["kickoff_utc"], updated["venue_id"]
            )
        merged.append(updated)
    return merged
