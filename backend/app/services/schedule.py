"""Schedule data access. Prefers PostgreSQL when DATABASE_URL is configured and
falls back to the in-process seed module on any error or when no DB is set.
When SCHEDULE_FEED_URL is configured, real fixture data is overlaid onto the
seed (TTL-cached, see app.services.schedule_feed)."""
from __future__ import annotations

from typing import Any

from sqlalchemy import text

from app import schemas
from app.db import get_engine
from app.seed import schedule_2026 as seed
from app.services import schedule_feed


def _query(sql: str) -> list[dict[str, Any]] | None:
    engine = get_engine()
    if engine is None:
        return None
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql))
            return [dict(row._mapping) for row in rows]
    except Exception:
        return None


# Seed data is static and the feed overlay only changes when the feed refreshes
# (schedule_feed.version()), so the built Pydantic models are cached instead of
# being re-instantiated on every request. DB-backed reads stay uncached — the
# database is the live source of truth when configured.
_seed_match_cache: tuple[int, list[schemas.Match]] | None = None
_seed_cities: list[schemas.City] | None = None
_seed_teams: list[schemas.Team] | None = None


def _seed_matches() -> list[schemas.Match]:
    global _seed_match_cache
    feed_version = schedule_feed.version()
    cache = _seed_match_cache
    if cache is None or cache[0] != feed_version:
        cache = (
            feed_version,
            [
                schemas.Match(**match)
                for match in schedule_feed.overlay_matches(seed.MATCHES)
            ],
        )
        _seed_match_cache = cache
    return cache[1]


def _all_matches() -> list[schemas.Match]:
    rows = _query(
        'SELECT id, match_number, stage, group_label AS "group", home_team, '
        "away_team, venue_id, kickoff_utc, kickoff_local, status "
        "FROM matches ORDER BY match_number"
    )
    if rows is not None:
        return [schemas.Match(**row) for row in rows]
    return _seed_matches()


def list_matches(
    *,
    city: str | None = None,
    team: str | None = None,
    group: str | None = None,
    stage: str | None = None,
    date: str | None = None,
) -> list[schemas.Match]:
    def keep(match: schemas.Match) -> bool:
        if city and match.venue_id != city:
            return False
        if group and match.group != group:
            return False
        if stage and match.stage != stage:
            return False
        if date and not match.kickoff_local.startswith(date):
            return False
        if team:
            needle = team.lower()
            if (
                needle not in match.home_team.lower()
                and needle not in match.away_team.lower()
            ):
                return False
        return True

    result = [match for match in _all_matches() if keep(match)]
    result.sort(key=lambda match: match.kickoff_utc)
    return result


def get_match(match_id: str) -> schemas.Match | None:
    for match in _all_matches():
        if match.id == match_id:
            return match
    return None


def list_cities() -> list[schemas.City]:
    global _seed_cities
    rows = _query(
        "SELECT id, name, country, lat, lng, airports, transport_notes "
        "FROM cities ORDER BY name"
    )
    if rows is not None:
        return [schemas.City(**row) for row in rows]
    if _seed_cities is None:
        _seed_cities = [schemas.City(**city) for city in seed.CITIES]
    return _seed_cities


def get_city(city_id: str) -> schemas.City | None:
    for city in list_cities():
        if city.id == city_id:
            return city
    return None


def list_teams() -> list[schemas.Team]:
    global _seed_teams
    rows = _query(
        'SELECT id, name, group_label AS "group", confederation '
        "FROM teams ORDER BY group_label, name"
    )
    if rows is not None:
        return [schemas.Team(**row) for row in rows]
    if _seed_teams is None:
        _seed_teams = [schemas.Team(**team) for team in seed.TEAMS]
    return _seed_teams
