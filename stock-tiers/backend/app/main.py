"""FastAPI application entrypoint."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.errors import register_exception_handlers
from app.providers.registry import build_primary, wrap_provider
from app.routers import briefs, kol, meta, portfolio, quotes, screener, tiers, trends
from app.services.tier_cache import TierCache
from app.store.brief_store import BriefStore
from app.store.kol_store import KolStore
from app.store.portfolio_store import PortfolioStore


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    primary, is_real = build_primary(settings)
    app.state.raw_primary = primary  # bare provider for the honest /meta probe
    app.state.stock_is_real = is_real
    app.state.stock_provider = wrap_provider(primary, is_real, settings)
    app.state.tier_cache = TierCache(ttl=settings.tier_cache_ttl)
    app.state.portfolio_store = PortfolioStore(Path(settings.data_dir) / "portfolio.json")
    app.state.brief_store = BriefStore(Path(settings.data_dir) / "briefs", keep=settings.brief_keep)
    app.state.kol_store = KolStore(Path(settings.data_dir) / "kol.json")
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
    app.include_router(portfolio.router)
    app.include_router(trends.router)
    app.include_router(briefs.router)
    app.include_router(briefs.feed_router)
    app.include_router(kol.router)
    app.include_router(meta.router)

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    # Single-service "one URL" deploy: also serve the built web app at "/".
    # API routes above take precedence (registered first); this catches the rest.
    static_dir = get_settings().static_web_dir
    if static_dir and os.path.isdir(static_dir):
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="web")

    return app


app = create_app()
