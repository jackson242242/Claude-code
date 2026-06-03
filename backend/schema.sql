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

-- Phase 2: lightweight accounts and saved trips / itineraries.

CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trips (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    share_token TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trip_items (
    id         TEXT PRIMARY KEY,
    trip_id    TEXT NOT NULL REFERENCES trips (id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,
    match_id   TEXT,
    city_id    TEXT,
    title      TEXT NOT NULL,
    subtitle   TEXT,
    price_usd  DOUBLE PRECISION NOT NULL DEFAULT 0,
    starts_at  TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trips_user ON trips (user_id);
CREATE INDEX IF NOT EXISTS idx_trip_items_trip ON trip_items (trip_id);

-- Phase 4: checkout / bookings. A booking is an immutable snapshot of a trip's
-- items at checkout time, with per-line deep links and a payment status.

CREATE TABLE IF NOT EXISTS bookings (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    trip_id           TEXT,
    trip_name         TEXT NOT NULL,
    status            TEXT NOT NULL,
    confirmation_code TEXT NOT NULL,
    currency          TEXT NOT NULL DEFAULT 'USD',
    total_usd         DOUBLE PRECISION NOT NULL DEFAULT 0,
    payment_provider  TEXT NOT NULL,
    lines             JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id);
