"""Secular-trend discovery: the diversification loop's HTTP surface.

GET lists tracked trends (seeding the AI anchor on first use); POST /discover
runs one loop iteration — Claude proposes NEW directions distinct from every
tracked one, and each trend's thesis feeds POST /api/tiers/thesis directly.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.config import get_settings
from app.deps import get_portfolio_store, get_trend_engine_dep
from app.schemas import SecularTrend
from app.services.trend_engine import TrendEngine, anchor_trend
from app.store.portfolio_store import PortfolioStore

router = APIRouter(prefix="/api/trends", tags=["trends"])


async def _tracked(store: PortfolioStore) -> list[SecularTrend]:
    trends = await store.list_trends()
    if not trends:
        # First use: seed the app's founding AI anchor so the discovery loop
        # always knows that direction is covered and must branch elsewhere.
        trends = await store.add_trends([anchor_trend()])
    return trends


@router.get("", response_model=list[SecularTrend])
async def list_trends(
    store: PortfolioStore = Depends(get_portfolio_store),
) -> list[SecularTrend]:
    return await _tracked(store)


@router.post("/discover", response_model=list[SecularTrend])
async def discover_trends(
    store: PortfolioStore = Depends(get_portfolio_store),
    engine: TrendEngine = Depends(get_trend_engine_dep),
) -> list[SecularTrend]:
    """One iteration of the discovery loop; returns the full tracked list."""
    known = await _tracked(store)
    new = await engine.discover(known, count=get_settings().trend_discover_count)
    return await store.add_trends(new)
