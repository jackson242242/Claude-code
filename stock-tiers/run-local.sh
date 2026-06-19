#!/usr/bin/env bash
# Run the Stock Alternatives Tier List prototype locally — ZERO secrets.
#
#   ./run-local.sh           # backend (:8000) + built web app (:8081) — open in browser
#   ./run-local.sh dev       # backend + Expo web dev server (hot reload)
#   ./run-local.sh native    # backend + Expo (scan QR with the Expo Go app)
#
# Prereqs: Python 3.11+, Node 20+. Everything runs on deterministic mock data,
# so no API keys are needed. Set ANTHROPIC_API_KEY to use the real Claude tier
# engine; set STOCK_PROVIDER=finnhub + FINNHUB_API_KEY for live market data.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-web}"
API_PORT=8000
WEB_PORT=8081

# --- backend ---------------------------------------------------------------
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  echo "==> creating backend venv + installing deps"
  python3 -m venv .venv
  .venv/bin/pip install -q -e .
fi
echo "==> starting backend on http://localhost:$API_PORT (STOCK_PROVIDER=mock)"
STOCK_PROVIDER=mock .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "$API_PORT" &
BACKEND_PID=$!
trap 'echo; echo "==> stopping"; kill $BACKEND_PID 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  curl -sf "http://localhost:$API_PORT/health" >/dev/null 2>&1 && break
  sleep 0.5
done
echo "==> backend healthy"

# --- app -------------------------------------------------------------------
cd "$ROOT/app"
if [ ! -d node_modules ]; then
  echo "==> installing app deps (first run only)"
  npm install --no-audit --no-fund
fi
export EXPO_PUBLIC_API_BASE_URL="http://localhost:$API_PORT"

case "$MODE" in
  dev)
    echo "==> Expo web dev server (hot reload)"
    npx expo start --web
    ;;
  native)
    echo "==> Expo (Expo Go) — scan the QR code with the Expo Go app"
    npx expo start
    ;;
  *)
    echo "==> building web app"
    npx expo export -p web >/dev/null
    echo
    echo "    ✅ Open  http://localhost:$WEB_PORT  in your browser"
    echo
    python3 -m http.server "$WEB_PORT" --directory dist
    ;;
esac
