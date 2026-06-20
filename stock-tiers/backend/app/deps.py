"""Dependency wiring. The provider is built once at startup and shared."""

from __future__ import annotations

from typing import cast

import anthropic
from fastapi import Request

from app.config import Settings, get_settings
from app.errors import AppError
from app.providers.base import StockDataProvider
from app.services.mock_tier_engine import MockTierEngine
from app.services.tier_engine import TierEngine
from app.services.tier_engine_base import TierEngineProtocol


def get_stock_provider(request: Request) -> StockDataProvider:
    return cast(StockDataProvider, request.app.state.stock_provider)


def get_settings_dep() -> Settings:
    return get_settings()


def get_tier_engine(request: Request) -> TierEngineProtocol:
    settings = get_settings()
    # Use the RAW provider (not the resilient/cached wrapper) for tier enrichment:
    # prices must be real-or-dropped, never silently backfilled with mock values.
    # The whole tier list is cached 24h, so this isn't a per-request cost.
    provider = cast(StockDataProvider, request.app.state.raw_primary)

    use_claude = settings.tier_provider == "claude" or (
        settings.tier_provider == "auto" and bool(settings.anthropic_api_key)
    )

    if not use_claude:
        # Zero-secret deterministic engine — powers the testable prototype.
        return MockTierEngine(provider)

    if not settings.anthropic_api_key:
        raise AppError(
            "TIER_PROVIDER=claude but ANTHROPIC_API_KEY is missing",
            type="not_configured",
            status=503,
        )
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return TierEngine(
        client=client,
        provider=provider,
        cache=request.app.state.tier_cache,
        settings=settings,
    )


def get_claude_engine(request: Request) -> TierEngine:
    """Thesis mode requires real Claude (the mock engine can't reason about a
    free-form thesis), so this dependency hard-requires ANTHROPIC_API_KEY."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise AppError(
            "Thesis mode needs ANTHROPIC_API_KEY",
            type="not_configured",
            status=503,
        )
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return TierEngine(
        client=client,
        provider=cast(StockDataProvider, request.app.state.raw_primary),
        cache=request.app.state.tier_cache,
        settings=settings,
    )
