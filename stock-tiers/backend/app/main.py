"""FastAPI application entrypoint."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.errors import register_exception_handlers
from app.providers.registry import build_stock_provider
from app.routers import quotes, screener, tiers
from app.services.tier_cache import TierCache


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    app.state.stock_provider = build_stock_provider(settings)
    app.state.tier_cache = TierCache(ttl=settings.tier_cache_ttl)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Stock Alternatives Tier List API", lifespan=lifespan)

    # The Expo client (web build or device) calls this cross-origin.
    # Defaults to "*"; set CORS_ORIGINS to the deployed web host to lock it down.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origin_list(),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(screener.router)
    app.include_router(quotes.router)
    app.include_router(tiers.router)

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
