"""Dependency wiring. The provider is built once at startup and shared."""

from __future__ import annotations

from typing import cast

import anthropic
from fastapi import Request

from app.config import Settings, get_settings
from app.errors import AppError
from app.providers.base import StockDataProvider
from app.services.brief_engine import BriefEngine
from app.services.kol_engine import KolEngine
from app.services.mock_tier_engine import MockTierEngine
from app.services.research_engine import ResearchEngine
from app.services.tier_engine import TierEngine
from app.services.tier_engine_base import TierEngineProtocol
from app.services.trend_engine import TrendEngine
from app.store.brief_store import BriefStore
from app.store.kol_store import KolStore
from app.store.portfolio_store import PortfolioStore


def get_stock_provider(request: Request) -> StockDataProvider:
    return cast(StockDataProvider, request.app.state.stock_provider)


def get_raw_provider(request: Request) -> StockDataProvider:
    """The bare primary provider (no resilient mock fallback): real-or-error.

    Used wherever a silently mocked price would lie to the user — portfolio
    entry prices, portfolio P&L, tier enrichment."""
    return cast(StockDataProvider, request.app.state.raw_primary)


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


def _require_anthropic(settings: Settings, feature: str) -> anthropic.AsyncAnthropic:
    if not settings.anthropic_api_key:
        raise AppError(
            f"{feature} needs ANTHROPIC_API_KEY",
            type="not_configured",
            status=503,
        )
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


def get_claude_engine(request: Request) -> TierEngine:
    """Thesis mode requires real Claude (the mock engine can't reason about a
    free-form thesis), so this dependency hard-requires ANTHROPIC_API_KEY."""
    settings = get_settings()
    return TierEngine(
        client=_require_anthropic(settings, "Thesis mode"),
        provider=cast(StockDataProvider, request.app.state.raw_primary),
        cache=request.app.state.tier_cache,
        settings=settings,
    )


def get_portfolio_store(request: Request) -> PortfolioStore:
    return cast(PortfolioStore, request.app.state.portfolio_store)


def get_research_engine(request: Request) -> ResearchEngine:
    """Daily research is Claude + web search over live prices — hard-requires
    the key, and uses the RAW provider (real-or-missing, never mock backfill)."""
    settings = get_settings()
    return ResearchEngine(
        client=_require_anthropic(settings, "Daily research"),
        provider=cast(StockDataProvider, request.app.state.raw_primary),
        settings=settings,
    )


def get_trend_engine_dep() -> TrendEngine:
    settings = get_settings()
    return TrendEngine(
        client=_require_anthropic(settings, "Trend discovery"),
        settings=settings,
    )


def get_brief_store(request: Request) -> BriefStore:
    return cast(BriefStore, request.app.state.brief_store)


def get_brief_engine() -> BriefEngine:
    settings = get_settings()
    return BriefEngine(
        client=_require_anthropic(settings, "Daily brief"),
        settings=settings,
    )


def get_kol_store(request: Request) -> KolStore:
    return cast(KolStore, request.app.state.kol_store)


def get_kol_engine(request: Request) -> KolEngine:
    settings = get_settings()
    return KolEngine(
        client=_require_anthropic(settings, "KOL tracker"),
        provider=cast(StockDataProvider, request.app.state.raw_primary),
        settings=settings,
    )
