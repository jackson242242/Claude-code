# Stock Alternatives Tier List

A mobile app that surfaces publicly-traded **"hot stocks"** (up **+50%–100%** over
the trailing 12 months), lets you pick one, and generates an **S–F tier list** of
the best publicly-traded **alternative or downstream** company stocks that capture
the *same investment thesis* — each with a rationale and tier justification.

> **Not financial advice.** Tier rankings are AI-generated for informational and
> educational purposes only.

## Architecture

```
Expo (React Native + TS)  ──HTTP──▶  FastAPI backend  ──▶  Claude API (tier engine)
   no secrets in client                holds all keys   └─▶  Finnhub (real market data)
                                                          └─▶  Mock provider (offline fallback)
```

- **`app/`** — Expo (React Native, TypeScript strict) client. Screens: Hot Stocks →
  Tier List → Ticker Detail. Talks to the backend via native `fetch`; no API keys
  ever live in the client.
- **`backend/`** — Python + FastAPI. Holds the market-data + Claude keys.
  - **Tier engine** (`app/services/tier_engine.py`) — calls Claude (`claude-opus-4-8`)
    with **forced tool use** for structured S–F output, then **validates and
    re-prices every entry against the market-data provider** so the LLM cannot
    hallucinate tickers or prices.
  - **Market data** — a `StockDataProvider` port with a deterministic **mock**
    implementation (offline, no keys) and a real **Finnhub** implementation,
    composed as `Cached(TTL) → Resilient(real, fallback=mock) → Primary`.

## Run it locally (one command, zero secrets)

```bash
cd stock-tiers
./run-local.sh            # backend (:8000) + builds & serves the web app (:8081)
```

Then open **http://localhost:8081** in your browser and click through:
Hot Stocks → S–F Tier List → Ticker Detail. No API keys needed (deterministic
mock data + mock tier engine). First run installs the backend venv and app deps.

Other modes:

```bash
./run-local.sh dev        # Expo web dev server with hot reload
./run-local.sh native     # Expo Go on your phone (scan the QR code)
```

Prereqs: Python 3.11+ and Node 20+. To use the real Claude tier engine, run with
`ANTHROPIC_API_KEY=... ./run-local.sh`; for live market data add
`STOCK_PROVIDER=finnhub FINNHUB_API_KEY=...`.

### Using real data (Claude + Finnhub)

Set the keys and run (locally or in Render):

```bash
STOCK_PROVIDER=finnhub FINNHUB_API_KEY=... ANTHROPIC_API_KEY=... ./run-local.sh
```

- **Tier engine:** with `ANTHROPIC_API_KEY` set, tiers are generated live by
  Claude (`claude-opus-4-8`); otherwise the deterministic mock engine runs.
- **Market data:** you must set **`STOCK_PROVIDER=finnhub`** (not just the key).
  A free Finnhub key works — the provider uses `/quote`, `/stock/profile2`, and
  `/stock/metric` (`52WeekPriceReturnDaily` for the 1-yr change); it does **not**
  use the premium `/stock/candle`. The first screener call scans
  `SCREENER_CANDIDATE_LIMIT` (default 30) symbols and is then cached 15 min, so
  the cold call is the slow one. On any upstream error/rate-limit the resilient
  wrapper silently falls back to mock data.
- **Confirm real data is live** (it's not obvious, because of the silent fallback):
  - `GET /api/meta/providers` → `{"stock":"finnhub","tierEngine":"claude","model":"claude-opus-4-8"}`
  - `GET /api/meta/stock-probe` → `{"ok":true,"provider":"finnhub",...}` (this calls
    Finnhub directly, bypassing the fallback — `ok:false` with an `error` means your
    key/network is the problem, and the app is serving mock data).

## Run the backend

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"

# Fully offline (mock data; tier engine needs ANTHROPIC_API_KEY):
STOCK_PROVIDER=mock .venv/bin/uvicorn app.main:app --reload   # :8000

# Real data:
export STOCK_PROVIDER=finnhub FINNHUB_API_KEY=... ANTHROPIC_API_KEY=...
.venv/bin/uvicorn app.main:app --reload
```

Endpoints: `GET /api/screener/hot-stocks?low=0.5&high=1.0`,
`GET /api/quotes/{ticker}`, `POST /api/tiers {"hotStockTicker":"NVDA"}`,
`GET /health`. See `backend/.env.example` for all settings.

## Run the app

```bash
cd app
npm install
EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:8000 npx expo start      # native (Expo Go)
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000   npx expo start --web  # browser
```

## Deploy a testable prototype (zero secrets)

The repo-root `render.yaml` Blueprint includes two services for this app:
`stock-tiers-api` (FastAPI) and `stock-tiers-web` (the Expo app exported to a
static web SPA, auto-wired to the API host). **No keys required** — the API runs
on deterministic seed data and a deterministic mock tier engine, so the whole
flow (Hot Stocks → S–F Tier List → Ticker Detail) works out of the box.

1. In Render: **New → Blueprint**, connect this repo, pick this branch.
2. Apply — Render builds both services. (Leave the optional secrets blank.)
3. Open the **`stock-tiers-web`** URL in any browser.

Optional upgrades (set in the Render dashboard, then redeploy):
- `ANTHROPIC_API_KEY` on `stock-tiers-api` → real Claude tier engine (auto-detected).
- `STOCK_PROVIDER=finnhub` + `FINNHUB_API_KEY` → live market data.

Build the web bundle yourself anytime: `cd app && npx expo export -p web` → `dist/`.

## 我的组合 · 每日研究 · 趋势发现 (portfolio + daily research + trend loop)

The app tracks a **long-term, buy-and-hold portfolio** and researches it daily:

- **加入组合**: on any stock detail page, 「加入长期组合」 freezes the entry price
  from live market data (raw provider — a mock price would lie) and tags the pick
  with the thesis/trend it came from.
- **我的组合** (`GET /api/portfolio`): live prices, change since entry, and a
  **方向分布** view grouping holdings by secular trend — the diversification lens.
- **每日研究** (`POST /api/portfolio/research/run`): Claude + web search re-checks
  each holding's ORIGINAL thesis (strengthening / intact / weakening / broken —
  judged on the thesis, not the price) plus a portfolio-level diversification
  read. The latest report is stored and served by `GET /api/portfolio/research`.
- **趋势方向** (`GET /api/trends`, `POST /api/trends/discover`): the
  **diversification loop**. Trend #1 is the app's AI anchor; every discovery pass
  feeds the tracked trends back into the prompt and asks for NEW directions from
  different drivers (energy, policy, geopolitics, demographics, healthcare…), so
  repeated runs walk the portfolio into more independent secular trends. Each
  trend's thesis feeds `POST /api/tiers/thesis` directly.

> This is research & monitoring tooling, **not financial advice** — the engine is
> hard-prompted to never promise or forecast returns, and every response carries
> the disclaimer.

### Scheduling the daily run (Render Cron Job)

The research pass runs whenever `POST /api/portfolio/research/run` is hit — the
app's 「立即更新」 button does it manually; a Render **Cron Job** automates it:

1. Render dashboard → **New → Cron Job** (same account as the web service).
2. Schedule: e.g. `30 13 * * 1-5` (13:30 UTC ≈ 9:30 ET, weekdays).
3. Command:
   ```bash
   curl -fsS -X POST https://<your-app>.onrender.com/api/portfolio/research/run \
     -H "x-cron-secret: $CRON_SECRET"
   ```
4. Set the same `CRON_SECRET` env var on **both** the web service and the cron
   job. If `CRON_SECRET` is unset on the service, the endpoint is open (fine for
   a single-user prototype; the in-app button uses it too).

### Storage caveat (Render free tier)

The portfolio/trends/research live in one JSON file at `DATA_DIR/portfolio.json`
(default `data/`). **Render's free-tier disk is ephemeral** — the file resets on
every deploy/restart. Options: accept re-adding picks after deploys (prototype),
or attach a Render persistent disk and point `DATA_DIR` at its mount path.

## Test / lint / typecheck

```bash
# backend
cd backend && .venv/bin/ruff check app tests && .venv/bin/mypy app && .venv/bin/python -m pytest

# app
cd app && npx tsc --noEmit && npx eslint . && npx jest
```

CI (`.github/workflows/ci.yml`) runs both suites with `STOCK_PROVIDER=mock` and no
keys, so the whole project is green offline.

## Notes & limitations

- **Network policy:** the live tier engine and Finnhub need outbound egress to
  `api.anthropic.com` / `finnhub.io`. If market data is blocked, the resilient
  wrapper serves mock data; the tier engine has no offline fallback and returns a
  502 (the app shows an error state).
- **Universe:** US equities only. The mock universe is ~40 hand-seeded tickers; the
  Finnhub screener scans a bundled large-cap candidate list (`providers/sp500.py`).
- **Model:** `claude-opus-4-8` by default (best thesis reasoning); switch via
  `TIER_MODEL`. Tier results are cached 24h to amortize cost.
