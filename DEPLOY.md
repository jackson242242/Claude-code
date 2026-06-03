# Deploying to Render (with live Duffel data)

This repo ships a [`render.yaml`](./render.yaml) Blueprint that deploys the
FastAPI backend and the Next.js frontend as two web services. With a Duffel
token set, **flights and hotels show live pricing/availability**; without it the
app falls back to deterministic seed/mock data, so it always renders.

> Why deploy to see it? Live third-party calls (Duffel) require outbound network
> access and a real API token. They can't run from the build sandbox — Render is
> where the integration actually lights up.

## 1. Get a Duffel access token

1. Sign up at <https://duffel.com> → **Developers → Access tokens**.
2. Create a token:
   - **Test** token — immediate; great for a first deploy. Stays (hotels) and
     air offers return real-shaped data for development.
   - **Live** token — requires activating your Duffel account; returns true
     bookable inventory.
3. Copy the token (starts with `duffel_test_…` or `duffel_live_…`).

The same key powers both flights and hotels (Duffel Stays).

## 2. Create the Blueprint on Render

1. Push this branch (or merge it) so `render.yaml` is on the branch Render reads.
2. In Render: **New → Blueprint**, connect this repository, and select the branch.
3. Render detects `render.yaml` and proposes two services: `worldcup-api` and
   `worldcup-web`.
4. When prompted for the **`DUFFEL_API_KEY`** value, paste your token. (It's the
   only secret; everything else is pre-wired.)
5. **Apply** to create and deploy both services.

## 3. See it

- Open the **`worldcup-web`** URL → browse a city's hotels or a route's flights;
  offers now come from Duffel (provider shows as `Duffel`).
- Sanity-check the backend: open `https://<worldcup-api-url>/meta/providers` —
  `flights` and `hotels` should report `"mode": "real"`.
- Health check: `https://<worldcup-api-url>/health` → `{"status":"ok"}`.

If Duffel is unreachable or returns an error, the resilient wrapper falls back to
mock data automatically — the page still works, provider just reads as the mock.

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
