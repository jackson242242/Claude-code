"""Dependency wiring. The provider is built once at startup and shared."""

from __future__ import annotations

from typing import cast

import anthropic
from fastapi import Request

from app.config import Settings, get_settings
from app.errors import AppError
from app.providers.base import StockDataProvider
from app.services.tier_engine import TierEngine


def get_stock_provider(request: Request) -> StockDataProvider:
    return cast(StockDataProvider, request.app.state.stock_provider)


def get_settings_dep() -> Settings:
    return get_settings()


def get_tier_engine(request: Request) -> TierEngine:
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise AppError(
            "Tier engine is not configured (ANTHROPIC_API_KEY missing)",
            type="not_configured",
            status=503,
        )
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return TierEngine(
        client=client,
        provider=request.app.state.stock_provider,
        cache=request.app.state.tier_cache,
        settings=settings,
    )
