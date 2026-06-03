-- Authoritative PostgreSQL schema for the World Cup 2026 Tour Guide API.
-- This file is the single source of truth for the database structure: update it
-- here first before changing any table. Apply with:
--   psql "$DATABASE_URL" -f backend/schema.sql
--
-- Kickoff timestamps are stored as TEXT (ISO 8601 strings) so the database, the
-- API and the TypeScript frontend share one identical string contract.

CREATE TABLE IF NOT EXISTS cities (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    country         TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    airports        TEXT[] NOT NULL,
    transport_notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS venues (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    city_id          TEXT NOT NULL REFERENCES cities (id),
    capacity         INTEGER NOT NULL,
    lat              DOUBLE PRECISION NOT NULL,
    lng              DOUBLE PRECISION NOT NULL,
    nearest_airports TEXT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    group_label   TEXT NOT NULL,
    confederation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
    id            TEXT PRIMARY KEY,
    match_number  INTEGER NOT NULL,
    stage         TEXT NOT NULL,
    group_label   TEXT,
    home_team     TEXT NOT NULL,
    away_team     TEXT NOT NULL,
    venue_id      TEXT NOT NULL REFERENCES venues (id),
    kickoff_utc   TEXT NOT NULL,
    kickoff_local TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'scheduled'
);

CREATE INDEX IF NOT EXISTS idx_matches_venue ON matches (venue_id);
CREATE INDEX IF NOT EXISTS idx_matches_group ON matches (group_label);
