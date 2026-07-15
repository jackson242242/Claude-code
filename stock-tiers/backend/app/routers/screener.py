"""Screener route: hot stocks up +50%-100% over the trailing year."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.deps import get_stock_provider
from app.providers.base import StockDataProvider
from app.schemas import HotStock

router = APIRouter(prefix="/api/screener", tags=["screener"])


@router.get("/hot-stocks", response_model=list[HotStock])
async def hot_stocks(
    low: float = Query(0.50, ge=-1.0, le=10.0),
    high: float = Query(1.00, ge=-1.0, le=10.0),
    provider: StockDataProvider = Depends(get_stock_provider),
) -> list[HotStock]:
    """Return hot stocks within [low, high] trailing-1yr change. Empty list is valid."""
    return await provider.screen_hot_stocks(low=low, high=high)
