# Deploying to Render (live flights + hotels)

This repo ships a [`render.yaml`](./render.yaml) Blueprint that deploys the
FastAPI backend and the Next.js frontend as two web services. With API keys set,
**flights and hotels show live pricing/availability**; without them the app falls
back to deterministic seed/mock data, so it always renders.

> Why deploy to see it? Live third-party calls require outbound network access
> and real API keys. They can't run from the build sandbox — Render is where the
> integration actually lights up.

## 1. Get the API keys

Flights and hotels use two independent providers, each optional — a missing key
just means that vertical serves mock data.

**Flights — Duffel** (`DUFFEL_API_KEY`)
1. Sign up at <https://duffel.com> → **Developers → Access tokens**.
2. Create a **Test** token (immediate; simulated airlines return real-shaped
   offers) or a **Live** token (activated account; true bookable inventory).
3. Copy it (starts with `duffel_test_…` / `duffel_live_…`).

**Hotels — LiteAPI** (`LITEAPI_API_KEY`)
1. Sign up at <https://liteapi.travel> — instant, self-serve, no sales approval.
2. Copy a **sandbox** key (starts with `sand_…`) for testing, or a production key
   (requires a card) for real bookable rates.

> Why LiteAPI for hotels? Duffel Stays is sales-gated — a standard token returns
> `403 "This feature is not enabled for your account"`. LiteAPI gives instant
> self-serve hotel data. (To use Duffel for hotels once it's enabled on your
> account, set `HOTEL_PROVIDER=duffel`.)

## 2. Create the Blueprint on Render

1. Push this branch (or merge it) so `render.yaml` is on the branch Render reads.
2. In Render: **New → Blueprint**, connect this repository, and select the branch.
3. Render detects `render.yaml` and proposes two services: `worldcup-api` and
   `worldcup-web`.
4. When prompted, paste your secrets: **`DUFFEL_API_KEY`** (flights) and
   **`LITEAPI_API_KEY`** (hotels). Everything else is pre-wired. Supply one, both,
   or neither — whatever you omit serves mock data for that vertical.
5. **Apply** to create and deploy both services.

## 3. See it

- Open the **`worldcup-web`** URL → browse a route's flights or a city's hotels;
  flight offers come from **Duffel**, hotels from **LiteAPI**.
- Sanity-check config: open `https://<worldcup-api-url>/meta/providers` —
  `flights` and `hotels` should report `"mode": "real"`.
- Confirm live data per vertical (these bypass the mock fallback and surface the
  raw upstream result or error, so they're the source of truth):
  - `https://<worldcup-api-url>/meta/flight-probe` → `{"ok":true,…,"provider":"Duffel"}`
  - `https://<worldcup-api-url>/meta/hotel-probe` → `{"ok":true,…,"provider":"LiteAPI"}`
- Health check: `https://<worldcup-api-url>/health` → `{"status":"ok"}`.

If a provider is unreachable or errors, the resilient wrapper falls back to mock
automatically — the page still works, the provider just reads as the mock.

## How the wiring works (no manual URLs)

- `worldcup-web` gets `NEXT_PUBLIC_API_BASE_URL` from the API service's host, and
  `worldcup-api` gets `CORS_ORIGINS` from the web service's host — both via
  Render `fromService` references. The app code accepts a bare host and defaults
  to `https`, so no scheme juggling is needed.
- `NEXT_PUBLIC_*` is inlined at **build time**; Render makes the reference
  available during the build, so a rebuild picks up any URL change.

## 4. (Optional) Add PostgreSQL for persistence

The default deploy uses in-process seed data and in-memory trips/bookings — fine
for a demo, but trips reset on restart. To persist:

1. In Render: **New → PostgreSQL** (free tier is fine), then on `worldcup-api`
   add an env var `DATABASE_URL` from that database's **Internal Connection
   String**.
2. Load the schema and seed once (from a shell with `DATABASE_URL` exported, or
   Render's shell on the service):
   ```bash
   psql "$DATABASE_URL" -f backend/schema.sql
   cd backend && python -m app.seed.load
   ```
   `schema.sql` is the source of truth for the database structure.
3. Redeploy `worldcup-api`. It now reads/writes PostgreSQL and falls back to seed
   data only if the DB is unreachable.

## Notes

- **Free instances sleep** after inactivity; the first request after idle is slow
  while they wake.
- **Currency:** amounts are treated as USD (Duffel test accounts are
  USD-denominated). Multi-currency normalization (CAD/MXN via FX) across trip and
  booking totals is a tracked follow-up.
- **Schedule data:** group/knockout fixtures and exact kickoff slots are
  representative placeholders flagged in code; reconcile with the official FIFA
  2026 schedule before a real launch.
