# Matchday26 — World Cup 2026 Tour Guide · Development Guide

> Guidance for AI assistants (and humans) working in this repo. These instructions
> OVERRIDE default behavior — follow them. Keep this file current: when you change
> structure, commands, or conventions, update the matching section here.

## Project Overview
- **Product:** **Matchday26** — a companion app for the 2026 FIFA World Cup
  (USA · Canada · Mexico, June 11 – July 19, 2026; 104 matches, 16 host cities, 48 teams).
- **Core Goal:** Let fans browse the full match schedule and book flights, hotels, and
  transportation around the matches they want to attend — in English, Spanish, or French.
- **Target Audience:** People travelling to the 2026 World Cup.
- **Status:** Live on Render (frontend + FastAPI backend). It always renders: with no DB
  or API keys it falls back to deterministic seed/mock data; with keys set, flights and
  hotels show live pricing/availability. Deployment is documented in `DEPLOY.md` / `render.yaml`.

> The product is branded **Matchday26** in the UI/manifest; the package name and some
> docs still say "World Cup 2026 Tour Guide" — they refer to the same app.

## This Repo Is a Small Workspace
Most work is the Matchday26 app, but the repo also holds:
- **Matchday26 app** — `src/` (Next.js frontend) + `backend/` (FastAPI). **This is the default subject.**
- **VoiceMemoBot** — `voice-memo-watch/` — a *separate* product (voice memo → AI music remix →
  its own social feed; SwiftUI watchOS app + FastAPI backend). It has its own README and CI job.
  Don't conflate it with Matchday26.
- **Agent operations layer** — Markdown "memory" the agent team runs on (see *Operating Cadence* below).
- **`ZombieSpawner.lua`** at the repo root — an unrelated leftover from an earlier project. Ignore it.

## Tech Stack
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript (strict). Tailwind CSS v4.
  React Server Components for data loading; local `useState` for interactivity.
- **Backend:** Python + FastAPI (Pydantic v2).
- **Database:** PostgreSQL (optional in dev — the API falls back to seed data / in-memory repos).
- **Tests:** Jest + React Testing Library (frontend) · pytest (backend).
- **What NOT to use:** No Axios — use native `fetch` (see `src/services/apiClient.ts`).
  No Redux / global store — React Server Components + local state. No `any` (ESLint-enforced).

## Repository Layout
```
src/                       Next.js frontend
  app/                     Routes (App Router). One folder per page:
    page.tsx               Home (hero + live strip + news window)
    schedule/ matches/[id] cities/[id]
    flights/ hotels/ transport/
    trips/ trips/[id] trips/shared/[token]   Trip builder + shareable links
    bookings/ bookings/[id]                  Checkout + confirmations
    news/                                    News + fan footage
    api/assistant/route.ts                   AI concierge (streams from Anthropic)
    api/news/health/route.ts                 News health probe
    layout.tsx manifest.ts globals.css       Shell, PWA manifest, Tailwind theme tokens
  components/              UI (PascalCase). components/news/* = news/fan-footage UI
  services/                Frontend business logic + API client (NO logic in components)
  lib/                     Pure helpers (assistant, format, geo, rideshare, flags, hooks)
  mocks/                   Frontend mock/seed data (cities, matches, news, teams, …)
  data/                    Static JSON (e.g. tourist-videos.json)
  types/                   Shared TS types — mirror the backend JSON contract 1:1
  i18n/                    Localization (en/es/fr): messages.ts, server.ts, index.ts
__tests__/                 Frontend tests (Jest + RTL) — mirror src/ filenames
backend/                   FastAPI service
  app/main.py              App entry: routers, CORS, global error handler, metrics middleware
  app/config.py            Env-driven Settings (provider selection, keys, TTLs)
  app/routers/             HTTP routes (schedule, flights, hotels, transport, trips, bookings, meta)
  app/services/            Backend business logic (schedule, trips, bookings, payments, geo, deeplinks)
  app/providers/           Booking adapters (see Architecture) + registry
  app/repositories/        Trip persistence: in-memory (default) or SQL, chosen by registry
  app/seed/                Seed data + loader (schedule_2026.py, load.py)
  schema.sql               DB schema — SOURCE OF TRUTH for DB structure
  tests/                   Backend tests (pytest)
voice-memo-watch/          SEPARATE product (VoiceMemoBot) — own README + CI
scripts/                   Node utilities (generate-asset, refresh-tourist-videos)
docs/                      affiliates.md, chatbot-model-options.md
```
Path alias: `@/*` → `src/*` (tsconfig).

## Critical Commands
- **Install (frontend):** `npm install`
- **Install (backend):** `python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt`
- **Run Dev (frontend):** `npm run dev` (http://localhost:3000)
- **Run Dev (backend):** `cd backend && .venv/bin/uvicorn app.main:app --reload` (http://localhost:8000)
- **Tests:** `npm test` (frontend) · `cd backend && .venv/bin/python -m pytest` (backend)
- **Coverage:** `npm test -- --coverage` (writes `coverage/` lcov) · backend pytest emits coverage by default
- **Lint / Types:** `npm run lint` · `npm run typecheck` (`tsc --noEmit`)
- **Build (prod gate):** `npm run build` (`next build`)
- **DB Migration:** `psql "$DATABASE_URL" -f backend/schema.sql` then `cd backend && .venv/bin/python -m app.seed.load`

CI (`.github/workflows/ci.yml`) runs frontend (lint · types · test · build), Matchday26 backend
(pytest), and the VoiceMemoBot backend (pytest) on every push and PR.

## Architecture & Code Placement
- **Routing:** All page routes live in `src/app/`. Frontend route handlers (e.g. the AI
  concierge) live in `src/app/api/*/route.ts`.
- **Business logic:** Keep it out of UI components. Frontend logic → `src/services/`
  (and pure helpers → `src/lib/`). Backend logic → `backend/app/services/` + `backend/app/providers/`.
- **Frontend ↔ backend:** The frontend talks to FastAPI via `src/services/apiClient.ts`
  (native `fetch`, base URL `NEXT_PUBLIC_API_BASE_URL`). The JSON contract is camelCase and
  maps 1:1 onto `src/types/`. `NEXT_PUBLIC_USE_MOCKS=true` serves `src/mocks/` instead.
- **Booking adapters (providers):** Each vertical (flights/hotels/transport) sits behind an
  abstract provider in `backend/app/providers/base.py`. The default is a deterministic **mock**.
  Real adapters — **Duffel** (flights, hotel stays), **LiteAPI** (hotels), and a generic **HTTP**
  provider — register in `registry.py` under the same interface, selected by env vars
  (`FLIGHT_PROVIDER`, `HOTEL_PROVIDER`, `TRANSPORT_PROVIDER`). When a real provider is configured
  it's wrapped with a **resilient fallback to mock** + a **TTL cache** — so routes never change
  and the app degrades gracefully. `/meta` endpoints expose provider status and direct "probe"
  diagnostics that surface upstream errors instead of silently degrading.
- **Trip persistence (repositories):** Trips use an in-memory repo by default (process-wide
  singleton) and a **SQL repo when `DATABASE_URL` is set** — selected in `repositories/registry.py`.
- **Schedule:** Served from `backend/app/seed/schedule_2026.py`; an optional real **schedule feed**
  overlay (`SCHEDULE_FEED_URL`) can supply live fixtures/results without code changes.
- **AI concierge:** `POST /api/assistant` streams from the **Anthropic Messages API** via native
  fetch (no SDK). Default model is set in `src/lib/assistant.ts`. With no `ANTHROPIC_API_KEY` it
  returns an honest fallback line instead of failing. Pure logic lives in `src/lib/assistant.ts`
  (unit-tested); the route is a thin shell.
- **State Management:** RSC for data loading; local `useState` for interactivity. No global store.

## Backend API Surface (quick map)
- **Schedule/meta data:** `GET /matches`, `/matches/{id}`, `/cities`, `/cities/{id}`,
  `/cities/{id}/nearby`, `/teams`
- **Search (POST):** `/flights/search`, `/hotels/search`, `/transport/search`
- **Trips:** `GET /me`, CRUD under `/trips` (+ `/trips/{id}/items`, `/trips/{id}/suggestions`),
  and `GET /shared/{share_token}` for shareable links
- **Bookings:** create + `GET /bookings`, `/bookings/{id}`
- **Ops/diagnostics:** `/health`, `/meta/providers`, `/meta/metrics`, `/meta/hotel-probe`,
  `/meta/flight-probe`, `/meta/link-audit`

## Coding Conventions
- **Naming:** camelCase functions/vars, PascalCase components, UPPERCASE constants.
- **Types:** Strict TypeScript, no `any` (ESLint `@typescript-eslint/no-explicit-any`).
- **Style:** Functional components and arrow functions only.
- **JSON contract:** The API serializes camelCase (Pydantic alias generator) so it maps 1:1
  onto the TypeScript types in `src/types/`. Keep both sides in sync.
- **Error Handling:** All backend errors flow through the single global exception handler in
  `backend/app/main.py`, returning `{"error": {"message", "type"}}`. Don't add per-route try/catch
  for generic errors. Frontend API routes mirror this error shape.

## Testing & Quality Bar
- New frontend features need matching tests in `__tests__/`; backend features need tests in
  `backend/tests/`. Tests mirror source filenames.
- Run lint, type-check, build, and both test suites before writing summaries. Don't claim done
  until the gates pass — report failures honestly with the output.

## Avoid / Guardrails
- **No Breaking DB Changes:** Never alter DB structure without updating `backend/schema.sql` first
  (it is the source of truth), then the SQL repo + seed loader.
- **No Phantom Files:** Reuse the existing mock/seed layers — `src/mocks/` + `src/data/` (frontend)
  and `backend/app/seed/` / mock providers (backend). Don't invent parallel dummy data.
- **No new HTTP client:** native `fetch` only (no Axios). **No global store** (no Redux).
- **Don't leak secrets:** provider probes and health endpoints must never echo credentials.
- **VoiceMemoBot is separate:** don't entangle `voice-memo-watch/` with the Matchday26 app.

## Operating Cadence (运营节奏) — for agent sessions
This project runs on **Routines** (fresh ephemeral cloud sessions on a schedule). Each run is
"amnesiac": **the repo's Markdown docs are the only cross-run memory**, so every cycle reads the
backlog first, then writes progress back. Canonical docs:
- `CADENCE.md` — the deterministic playbook / cadence (product 12h, design 24h, etc.).
- `PROJECTS.md` — the majordomo's portfolio ledger (one entry per project; read+write each `/pm-cycle`).
- `MEMORY.md` — long-term decision log / status snapshots.
- `TEAM.md` — agent roster, governance, voting rules.
- `DESIGN.md` — the design "constitution" (current: luxury dark, Polymarket-style tokens).
- `BRAND.md` — product/brand strategy (documentation only; doesn't change code).
- `DEPLOY.md` + `render.yaml` — how the live deploy is wired.
- `.claude/commands/*` — slash-command playbooks (pm-cycle, product-upgrade, design-upgrade, …);
  `.claude/agents/majordomo.md` — the portfolio coordinator.

## Operating Principles (运营原则)
> How every agent/session works on this project. Keep these in mind always.
- **简单优先 Keep it simple:** 用最少的步骤达成目标，不过度设计。
- **自主执行 Act autonomously:** 能自己判断并完成的事，直接做，不反复确认。
- **不懂不动 Don't act on what you don't understand:** 细节不清就先弄清、想清、计划好再动手——绝不在不理解时贸然改动。
- **诚实第一 Honesty first:** 不夸大、不假装完成；做不到 / 不确定 / 超出能力（例如直接发社媒、保证流量数字）就如实说明。
- **门禁与可逆 Gates & reversibility:** 改动先过 typecheck/test/lint；面向用户或不可逆的改动先想清楚，必要时先预览或走投票。
