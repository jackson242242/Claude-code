# Single-service deploy: builds the Expo web app and serves it + the JSON API
# from one FastAPI process (one URL, zero secrets, deterministic mock data).
# Build context must be the stock-tiers/ directory.

# --- stage 1: build the web app (Node) ---
FROM node:20-slim AS web
WORKDIR /web
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
# No EXPO_PUBLIC_API_BASE_URL -> the client calls the API same-origin.
RUN npx expo export -p web

# --- stage 2: backend (Python) that also serves the built web ---
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=web /web/dist ./web
ENV STATIC_WEB_DIR=/app/web
ENV STOCK_PROVIDER=mock
# Portfolio/trends/research JSON store (ephemeral unless a disk is mounted here).
ENV DATA_DIR=/app/data
# Render provides $PORT; default to 8000 for local `docker run`.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
