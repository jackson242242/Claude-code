"""Quote route: detail for a single ticker."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_stock_provider
from app.providers.base import StockDataProvider
from app.schemas import TickerDetail

router = APIRouter(prefix="/api/quotes", tags=["quotes"])


@router.get("/{ticker}", response_model=TickerDetail)
async def quote(
    ticker: str,
    provider: StockDataProvider = Depends(get_stock_provider),
) -> TickerDetail:
    """Return detail for one ticker. Raises 404 (AppError) if unknown."""
    return await provider.get_quote(ticker)
