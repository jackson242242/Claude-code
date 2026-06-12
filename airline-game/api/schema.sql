-- SkyEmpire M5.1 persistence schema (source of truth, CONTRACT §1)
-- Run: psql "$DATABASE_URL" -f api/schema.sql

CREATE TABLE IF NOT EXISTS games (
    id         TEXT        PRIMARY KEY,
    state      JSONB       NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
