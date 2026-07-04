"""Long-term portfolio: positions, live P&L view, and the daily research pass."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.config import get_settings
from app.deps import get_portfolio_store, get_raw_provider, get_research_engine
from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.schemas import (
    DISCLAIMER,
    AddPositionRequest,
    PortfolioPosition,
    PortfolioView,
    ResearchReport,
    TrendSlice,
)
from app.services.research_engine import ResearchEngine, enrich_positions
from app.store.portfolio_store import PortfolioStore

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

_UNTAGGED = "未分类"


@router.get("", response_model=PortfolioView)
async def get_portfolio(
    store: PortfolioStore = Depends(get_portfolio_store),
    provider: StockDataProvider = Depends(get_raw_provider),
) -> PortfolioView:
    """The portfolio with live prices + a diversification view by secular trend."""
    positions = await store.list_positions()
    holdings = await enrich_positions(provider, positions)

    by_trend: dict[str, list[str]] = {}
    for h in holdings:
        by_trend.setdefault(h.trend or _UNTAGGED, []).append(h.ticker)
    total = len(holdings)
    slices = [
        TrendSlice(trend=trend, tickers=tickers, weight_pct=len(tickers) / total)
        for trend, tickers in sorted(by_trend.items(), key=lambda kv: -len(kv[1]))
    ]

    return PortfolioView(
        holdings=holdings,
        trend_slices=slices,
        disclaimer=DISCLAIMER,
        generated_at=datetime.now(UTC).isoformat(),
    )


@router.post("/positions", response_model=PortfolioPosition, status_code=201)
async def add_position(
    body: AddPositionRequest,
    store: PortfolioStore = Depends(get_portfolio_store),
    provider: StockDataProvider = Depends(get_raw_provider),
) -> PortfolioPosition:
    """Add a buy-and-hold pick; entry price is frozen from live market data
    (raw provider: a mock-backfilled entry price would be a lie)."""
    ticker = body.ticker.strip().upper()
    if not ticker:
        raise AppError("Ticker is required", type="validation_error", status=422)
    try:
        quote = await provider.get_quote(ticker)
    except (AppError, ProviderError) as exc:
        raise AppError(
            f"Can't price {ticker} right now — not added",
            type="not_found",
            status=404,
        ) from exc

    now = datetime.now(UTC)
    position = PortfolioPosition(
        ticker=quote.ticker,
        name=quote.name,
        entry_price=quote.price,
        entry_date=now.date().isoformat(),
        trend=(body.trend or "").strip() or None,
        thesis=(body.thesis or "").strip() or None,
        added_at=now.isoformat(),
    )
    await store.add_position(position)  # 409 if already held
    return position


@router.delete("/positions/{ticker}")
async def remove_position(
    ticker: str,
    store: PortfolioStore = Depends(get_portfolio_store),
) -> dict[str, str]:
    if not await store.remove_position(ticker):
        raise AppError(f"{ticker.upper()} is not in the portfolio", type="not_found", status=404)
    return {"removed": ticker.upper()}


@router.get("/research", response_model=ResearchReport)
async def latest_research(
    store: PortfolioStore = Depends(get_portfolio_store),
) -> ResearchReport:
    report = await store.get_research()
    if report is None:
        raise AppError(
            "No research report yet — run one first",
            type="not_found",
            status=404,
        )
    return report


@router.post("/research/run", response_model=ResearchReport)
async def run_research(
    store: PortfolioStore = Depends(get_portfolio_store),
    engine: ResearchEngine = Depends(get_research_engine),
    x_cron_secret: Annotated[str | None, Header()] = None,
) -> ResearchReport:
    """Run the research pass now (the daily Render Cron job hits this too).

    If CRON_SECRET is set, the x-cron-secret header must match.
    """
    settings = get_settings()
    if settings.cron_secret and x_cron_secret != settings.cron_secret:
        raise AppError("Bad or missing x-cron-secret", type="unauthorized", status=401)

    positions = await store.list_positions()
    report = await engine.run(positions)
    await store.set_research(report)
    return report
