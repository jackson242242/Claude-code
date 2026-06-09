# World Cup 2026 Tour Guide — Project Guide

## Project Overview
- **Purpose:** A companion app for the 2026 FIFA World Cup (USA · Canada · Mexico).
- **Core Goal:** Let fans browse the full match schedule and easily book flights,
  hotels, and transportation around the matches they want to attend.
- **Target Audience:** People travelling to the 2026 World Cup.

## Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript (strict).
- **Backend:** Python + FastAPI.
- **Database:** PostgreSQL (optional in dev — the API falls back to seed data).
- **What NOT to use:** No Axios — use native `fetch`. No Redux — use React Server
  Components + local state.

> Note: an unrelated `ZombieSpawner.lua` from an earlier project still lives at the
> repo root. It is not part of this app and can be ignored.

## Repository Layout
- `src/` — Next.js frontend (pages in `src/app/`, logic in `src/services/`, mock
  data in `src/mocks/`, shared types in `src/types/`, UI in `src/components/`).
- `__tests__/` — frontend tests (Jest + React Testing Library).
- `backend/` — FastAPI service (`backend/app/...`), `schema.sql`, `backend/tests/`.

## Critical Commands
- **Install (frontend):** `npm install`
- **Install (backend):** `python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt`
- **Run Dev (frontend):** `npm run dev` (http://localhost:3000)
- **Run Dev (backend):** `cd backend && .venv/bin/uvicorn app.main:app --reload` (http://localhost:8000)
- **Run Tests:** `npm test` (frontend) · `cd backend && .venv/bin/python -m pytest` (backend)
- **Lint / Types:** `npm run lint` · `npm run typecheck`
- **Database Migration:** `psql "$DATABASE_URL" -f backend/schema.sql` then `cd backend && .venv/bin/python -m app.seed.load`

## Architecture & Code Placement
- **Routing:** All page routes live in `src/app/`.
- **Business Logic:** Keep logic out of UI components; isolate it in `src/services/`
  (frontend) and `backend/app/services/` + `backend/app/providers/` (backend).
- **State Management:** React Server Components for data loading; local `useState`
  for interactivity. No global store.
- **Booking adapters:** Each vertical (flights/hotels/transport) is fronted by an
  abstract provider in `backend/app/providers/base.py` with a mock implementation.
  Real APIs register in `registry.py` under the same interface — no route changes.

## Coding Conventions
- **Naming:** camelCase functions, PascalCase components, UPPERCASE constants.
- **Types:** Strict TypeScript. No `any` (enforced by ESLint
  `@typescript-eslint/no-explicit-any`).
- **Error Handling:** API errors flow through a single global exception handler in
  `backend/app/main.py` returning `{"error": {"message", "type"}}`.
- **Style:** Functional components and arrow functions only.
- **JSON contract:** The API serializes camelCase (Pydantic alias generator) so it
  maps 1:1 onto the TypeScript types in `src/types/`.

## Testing & Quality Bar
- New frontend features need matching tests in `__tests__/`; backend features need
  tests in `backend/tests/`.
- Run lint, type-check, and both test suites before writing summaries.

## Avoid / Guardrails
- **No Breaking Changes:** Never alter the database structure without updating
  `backend/schema.sql` first (it is the source of truth).
- **No Phantom Files:** Reuse the existing mock layer in `src/mocks/` (frontend) and
  `backend/app/seed/` / mock providers (backend); don't invent parallel dummy data.
