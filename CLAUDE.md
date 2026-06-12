# Workspace Guide for AI Assistants

> **Read this first.** This repo is a small multi-project workspace. This file has
> two layers: a **generic constitution** (principles, gates, guardrails — reusable
> in any repo) and **project-specific blocks** below the divider. Nested
> `CLAUDE.md` files add per-project detail when you work inside a subdirectory.
> These instructions OVERRIDE default behavior — follow them, and keep them current.

<!-- ========================================================================= -->
<!-- GENERIC CONSTITUTION — reusable across projects. The reusable skeleton is   -->
<!-- docs/CLAUDE.template.md; copy it to bootstrap a new repo or sub-project.     -->
<!-- ========================================================================= -->

## How documentation is layered here
Claude Code auto-loads the nearest `CLAUDE.md` when you work in a directory, so we
split docs by scope instead of one giant file:

| Layer | Lives in | Holds |
|---|---|---|
| **Constitution** | this file (top half) | Principles, quality gates, guardrails — project-agnostic. |
| **Primary project** | this file (bottom half) | Matchday26 facts (its code is at the repo root, so it has no subfolder of its own). |
| **Satellite projects** | `<project>/CLAUDE.md` | Self-contained facts for a product in its own folder (e.g. `voice-memo-watch/CLAUDE.md`). |
| **Agent memory / ops** | `ops/` | Cross-run "memory": cadence, portfolio ledger, decisions, team, design, brand. |
| **Reusable skeleton** | `docs/CLAUDE.template.md` | Fill-in-the-blank template for documenting a new project. |

**When you add a new project:** give it its own folder + a nested `CLAUDE.md` copied
from `docs/CLAUDE.template.md`. Don't grow this root file with another product's specifics.

## Operating Principles (运营原则)
> How every agent/session works in this repo. Keep these in mind always.
- **简单优先 Keep it simple:** 用最少的步骤达成目标，不过度设计。
- **自主执行 Act autonomously:** 能自己判断并完成的事，直接做，不反复确认。
- **不懂不动 Don't act on what you don't understand:** 细节不清就先弄清、想清、计划好再动手——绝不在不理解时贸然改动。
- **诚实第一 Honesty first:** 不夸大、不假装完成；做不到 / 不确定 / 超出能力就如实说明（报告失败要附输出）。
- **门禁与可逆 Gates & reversibility:** 改动先过 typecheck/test/lint；面向用户或不可逆的改动先想清楚，必要时先预览或走投票。

## Universal Conventions & Quality Gates
- **Gates before "done":** run the project's lint, type-check, build, and test suites
  before claiming a task is complete. If a gate fails, say so with the output.
- **Tests mirror source:** new features ship with tests whose filenames mirror the
  source they cover, in that project's test directory.
- **Source-of-truth discipline:** never change a derived artifact without first updating
  its declared source of truth (e.g. a DB schema file before the code that uses it).
- **No phantom data:** reuse a project's existing mock/seed/fixture layer; don't invent
  parallel dummy data.
- **Don't leak secrets:** diagnostics, health endpoints, and logs must never echo credentials.
- **Keep docs current:** when you change structure, commands, or conventions, update the
  matching `CLAUDE.md` (this one or a nested one) in the same change.
- **Commit/PR discipline:** branch off the default branch unless told otherwise; commit/push
  only when asked; don't open a PR unless explicitly requested.

## Agent operations (`ops/`)
This repo runs on **Routines** — fresh ephemeral cloud sessions on a schedule. Each run is
"amnesiac", so **the Markdown docs in `ops/` are the only cross-run memory**: read the
backlog first, write progress back last. Canonical docs:
- `ops/CADENCE.md` — deterministic playbook / cadence (product 12h, design on-demand, etc.).
- `ops/PROJECTS.md` — majordomo's portfolio ledger (one entry per project; read+write each `/pm-cycle`).
- `ops/MEMORY.md` — long-term decision log / status snapshots.
- `ops/TEAM.md` — agent roster, governance, voting rules.
- `ops/DESIGN.md` — the design "constitution" (current: luxury dark, Polymarket-style tokens).
- `ops/BRAND.md` — product/brand strategy (documentation only; doesn't change code).
- `.claude/commands/*` — slash-command playbooks (pm-cycle, product-upgrade, design-upgrade, …);
  `.claude/agents/majordomo.md` — the portfolio coordinator.

## Workspace map
- **Matchday26** — `src/` (Next.js) + `backend/` (FastAPI). **Primary; documented below.**
- **VoiceMemoBot** — `voice-memo-watch/` — a *separate* product (its own README + `CLAUDE.md` + CI job).
- **Agent ops** — `ops/` + `.claude/` (see above).
- **Deploy** — `DEPLOY.md` + `render.yaml` describe the live Render wiring.
- **`ZombieSpawner.lua`** at the repo root — an unrelated leftover from an earlier project. Ignore it.

<!-- ========================================================================= -->
<!-- PROJECT-SPECIFIC — Matchday26. (Its code lives at the repo root.)           -->
<!-- ========================================================================= -->

# Project: Matchday26 — World Cup 2026 Tour Guide

## Overview
- **Product:** **Matchday26** — a companion app for the 2026 FIFA World Cup
  (USA · Canada · Mexico, June 11 – July 19, 2026; 104 matches, 16 host cities, 48 teams).
- **Core goal:** Browse the full match schedule and book flights, hotels, and transport
  around the matches you want to attend — in English, Spanish, or French.
- **Status:** Live on Render (frontend + FastAPI backend). It always renders: with no DB
  or API keys it falls back to deterministic seed/mock data; with keys set, flights and
  hotels show live pricing/availability. See `DEPLOY.md` / `render.yaml`.

> Branded **Matchday26** in the UI/manifest; the package name and some docs still say
> "World Cup 2026 Tour Guide" — same app.

## Tech Stack
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript (strict). Tailwind CSS v4.
  React Server Components for data loading; local `useState` for interactivity.
- **Backend:** Python + FastAPI (Pydantic v2).
- **Database:** PostgreSQL (optional in dev — the API falls back to seed data / in-memory repos).
- **Tests:** Jest + React Testing Library (frontend) · pytest (backend).
- **What NOT to use:** No Axios — native `fetch` (`src/services/apiClient.ts`). No Redux /
  global store — RSC + local state. No `any` (ESLint-enforced).

## Layout
```
src/                       Next.js frontend
  app/                     Routes (App Router), one folder per page:
    page.tsx schedule/ matches/[id] cities/[id]
    flights/ hotels/ transport/
    trips/ trips/[id] trips/shared/[token]   Trip builder + shareable links
    bookings/ bookings/[id]                  Checkout + confirmations
    news/                                    News + fan footage
    api/assistant/route.ts                   AI concierge (streams from Anthropic)
    api/news/health/route.ts                 News health probe
    layout.tsx manifest.ts globals.css       Shell, PWA manifest, Tailwind theme tokens
  components/  UI (PascalCase); components/news/* = news/fan-footage UI
  services/    Frontend business logic + API client (NO logic in components)
  lib/         Pure helpers (assistant, format, geo, rideshare, flags, hooks)
  mocks/       Frontend mock/seed data       data/  Static JSON
  types/       Shared TS types — mirror the backend JSON contract 1:1
  i18n/        Localization (en/es/fr): messages.ts, server.ts, index.ts
__tests__/                 Frontend tests (Jest + RTL) — mirror src/ filenames
backend/                   FastAPI service
  app/main.py              Entry: routers, CORS, global error handler, metrics middleware
  app/config.py            Env-driven Settings (provider selection, keys, TTLs)
  app/routers/ services/   HTTP routes · business logic
  app/providers/           Booking adapters + registry (see Architecture)
  app/repositories/        Trip persistence: in-memory (default) or SQL, by registry
  app/seed/                Seed data + loader (schedule_2026.py, load.py)
  schema.sql               DB schema — SOURCE OF TRUTH for DB structure
  tests/                   Backend tests (pytest)
```
Path alias: `@/*` → `src/*` (tsconfig).

## Commands
- **Install:** `npm install` · `python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt`
- **Dev:** `npm run dev` (:3000) · `cd backend && .venv/bin/uvicorn app.main:app --reload` (:8000)
- **Tests:** `npm test` · `cd backend && .venv/bin/python -m pytest`
- **Coverage:** `npm test -- --coverage` (writes `coverage/`) · backend pytest emits coverage by default
- **Lint / Types / Build:** `npm run lint` · `npm run typecheck` · `npm run build`
- **DB migration:** `psql "$DATABASE_URL" -f backend/schema.sql` then `cd backend && .venv/bin/python -m app.seed.load`

CI (`.github/workflows/ci.yml`) runs frontend (lint · types · test · build), the Matchday26
backend (pytest), and the VoiceMemoBot backend (pytest) on every push and PR.

## Architecture & Code Placement
- **Routing:** page routes in `src/app/`; frontend route handlers in `src/app/api/*/route.ts`.
- **Business logic:** out of UI components. Frontend → `src/services/` (pure helpers → `src/lib/`).
  Backend → `backend/app/services/` + `backend/app/providers/`.
- **Frontend ↔ backend:** the frontend calls FastAPI via `src/services/apiClient.ts` (native
  `fetch`, base URL `NEXT_PUBLIC_API_BASE_URL`). JSON contract is camelCase, mapping 1:1 onto
  `src/types/`. `NEXT_PUBLIC_USE_MOCKS=true` serves `src/mocks/` instead.
- **Booking adapters (providers):** each vertical sits behind an abstract provider in
  `backend/app/providers/base.py`. Default is a deterministic **mock**. Real adapters —
  **Duffel** (flights, hotel stays), **LiteAPI** (hotels), generic **HTTP** — register in
  `registry.py` under one interface, selected by env vars (`FLIGHT_PROVIDER`, `HOTEL_PROVIDER`,
  `TRANSPORT_PROVIDER`). A configured real provider is wrapped with **resilient fallback to mock**
  + a **TTL cache**, so routes never change and the app degrades gracefully. `/meta` exposes
  provider status + "probe" diagnostics that surface upstream errors instead of degrading silently.
- **Trip persistence (repositories):** in-memory by default (process-wide singleton); **SQL repo
  when `DATABASE_URL` is set** — chosen in `repositories/registry.py`.
- **Schedule:** from `backend/app/seed/schedule_2026.py`; optional live **schedule feed** overlay
  (`SCHEDULE_FEED_URL`) supplies fixtures/results without code changes.
- **AI concierge:** `POST /api/assistant` streams from the **Anthropic Messages API** via native
  fetch (no SDK). Model is set in `src/lib/assistant.ts`; with no `ANTHROPIC_API_KEY` it returns an
  honest fallback. Pure, unit-tested logic in `src/lib/assistant.ts`; the route is a thin shell.

## Backend API Surface (quick map)
- **Schedule/meta:** `GET /matches`, `/matches/{id}`, `/cities`, `/cities/{id}`, `/cities/{id}/nearby`, `/teams`
- **Search (POST):** `/flights/search`, `/hotels/search`, `/transport/search`
- **Trips:** `GET /me`, CRUD under `/trips` (+ `/trips/{id}/items`, `/trips/{id}/suggestions`), `GET /shared/{share_token}`
- **Bookings:** create + `GET /bookings`, `/bookings/{id}`
- **Ops/diagnostics:** `/health`, `/meta/providers`, `/meta/metrics`, `/meta/hotel-probe`, `/meta/flight-probe`, `/meta/link-audit`

## Conventions & Guardrails (Matchday26)
- **Naming:** camelCase functions/vars, PascalCase components, UPPERCASE constants.
- **Types:** strict TS, no `any` (`@typescript-eslint/no-explicit-any`). Functional components + arrow functions.
- **JSON contract:** API serializes camelCase (Pydantic alias generator), mapping 1:1 onto `src/types/`. Keep both sides in sync.
- **Error handling:** all backend errors flow through the single global handler in
  `backend/app/main.py` → `{"error": {"message", "type"}}`. No per-route try/catch for generic
  errors. Frontend API routes mirror this shape.
- **No breaking DB changes:** update `backend/schema.sql` first (source of truth), then the SQL repo + seed loader.
- **VoiceMemoBot is separate:** don't entangle `voice-memo-watch/` with Matchday26.
