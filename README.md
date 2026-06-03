# World Cup 2026 Tour Guide

[![CI](https://github.com/jackson242242/Claude-code/actions/workflows/ci.yml/badge.svg)](https://github.com/jackson242242/Claude-code/actions/workflows/ci.yml)

A companion app for the **2026 FIFA World Cup** (USA · Canada · Mexico). Browse the
full match schedule and book the flights, hotels, and transportation you need to
follow the matches you want to attend — in English, Spanish, or French.

## Features

- **Full 104-match schedule** across 16 host cities, with match detail pages that
  surface nearby airports, hotels, and transport options.
- **Trip builder** — add matches to a multi-city itinerary and get suggested hotels
  and inter-city flights/transport.
- **Checkout** — reserve a trip and get a confirmation code plus partner deep links.
- **Pluggable providers** — each vertical (flights/hotels/transport) sits behind an
  adapter, defaulting to deterministic mocks so the app runs with no DB or API keys.

## Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript (strict), React Server Components.
- **Backend:** Python + FastAPI.
- **Database:** PostgreSQL (optional in dev — the API falls back to seed data).

## Getting Started

### Frontend

```bash
npm install
npm run dev          # http://localhost:3000
```

### Backend

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cd backend && .venv/bin/uvicorn app.main:app --reload   # http://localhost:8000
```

The backend runs against deterministic seed data out of the box. To use a real
database, set `DATABASE_URL`, run the schema, and load seed data:

```bash
psql "$DATABASE_URL" -f backend/schema.sql
cd backend && .venv/bin/python -m app.seed.load
```

## Testing & Quality

```bash
npm run lint                 # ESLint (next lint)
npm run typecheck            # tsc --noEmit (strict, no `any`)
npm test                     # Jest + React Testing Library
npm test -- --coverage       # frontend coverage report

cd backend && .venv/bin/python -m pytest   # pytest (emits coverage by default)
```

Coverage is wired into both suites: the frontend writes an `lcov` report to
`coverage/`, and the backend emits a `term-missing` summary plus `coverage.xml`.
CI runs lint, type-check, tests, and `next build` on every push and pull request,
and uploads both coverage reports as build artifacts.

## Repository Layout

- `src/` — Next.js frontend (routes in `src/app/`, logic in `src/services/`, mock
  data in `src/mocks/`, shared types in `src/types/`, UI in `src/components/`).
- `__tests__/` — frontend tests (Jest + RTL).
- `backend/` — FastAPI service (`backend/app/...`), `schema.sql`, `backend/tests/`.

> Note: an unrelated `ZombieSpawner.lua` from an earlier project still lives at the
> repo root. It is not part of this app and can be ignored.
