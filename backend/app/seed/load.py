"""Apply schema.sql and load the 2026 seed data into PostgreSQL.

Usage (requires DATABASE_URL):
    cd backend && python -m app.seed.load
"""
from __future__ import annotations

from pathlib import Path

from sqlalchemy import text

from app.db import get_engine
from app.seed import schedule_2026 as seed

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "schema.sql"

_CITY_SQL = text(
    "INSERT INTO cities (id, name, country, lat, lng, airports, transport_notes) "
    "VALUES (:id, :name, :country, :lat, :lng, :airports, :transport_notes) "
    "ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, "
    "lat = EXCLUDED.lat, lng = EXCLUDED.lng, airports = EXCLUDED.airports, "
    "transport_notes = EXCLUDED.transport_notes"
)
_VENUE_SQL = text(
    "INSERT INTO venues (id, name, city_id, capacity, lat, lng, nearest_airports) "
    "VALUES (:id, :name, :city_id, :capacity, :lat, :lng, :nearest_airports) "
    "ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city_id = EXCLUDED.city_id, "
    "capacity = EXCLUDED.capacity, lat = EXCLUDED.lat, lng = EXCLUDED.lng, "
    "nearest_airports = EXCLUDED.nearest_airports"
)
_TEAM_SQL = text(
    "INSERT INTO teams (id, name, group_label, confederation) "
    "VALUES (:id, :name, :group, :confederation) "
    "ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "
    "group_label = EXCLUDED.group_label, confederation = EXCLUDED.confederation"
)
_MATCH_SQL = text(
    "INSERT INTO matches (id, match_number, stage, group_label, home_team, "
    "away_team, venue_id, kickoff_utc, kickoff_local, status) "
    "VALUES (:id, :match_number, :stage, :group, :home_team, :away_team, "
    ":venue_id, :kickoff_utc, :kickoff_local, :status) "
    "ON CONFLICT (id) DO UPDATE SET match_number = EXCLUDED.match_number, "
    "stage = EXCLUDED.stage, group_label = EXCLUDED.group_label, "
    "home_team = EXCLUDED.home_team, away_team = EXCLUDED.away_team, "
    "venue_id = EXCLUDED.venue_id, kickoff_utc = EXCLUDED.kickoff_utc, "
    "kickoff_local = EXCLUDED.kickoff_local, status = EXCLUDED.status"
)


def _statements(sql: str) -> list[str]:
    return [chunk.strip() for chunk in sql.split(";") if chunk.strip()]


def load() -> None:
    engine = get_engine()
    if engine is None:
        raise SystemExit("DATABASE_URL is not set; nothing to load.")

    ddl = SCHEMA_PATH.read_text(encoding="utf-8")
    with engine.begin() as conn:
        for statement in _statements(ddl):
            conn.execute(text(statement))
        conn.execute(_CITY_SQL, seed.CITIES)
        conn.execute(_VENUE_SQL, seed.VENUES)
        conn.execute(_TEAM_SQL, seed.TEAMS)
        conn.execute(_MATCH_SQL, seed.MATCHES)

    print(
        f"Loaded {len(seed.CITIES)} cities, {len(seed.VENUES)} venues, "
        f"{len(seed.TEAMS)} teams, {len(seed.MATCHES)} matches."
    )


if __name__ == "__main__":
    load()
