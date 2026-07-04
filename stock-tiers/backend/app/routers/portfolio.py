"""Long-term portfolio: positions, live P&L view with manager-style alerts,
and the daily research pass."""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header

from app.config import get_settings
from app.deps import get_portfolio_store, get_raw_provider, get_research_engine
from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.schemas import (
    AddPositionRequest,
    PortfolioPosition,
    PortfolioView,
    ResearchReport,
    UpdatePositionRequest,
)
from app.services.portfolio_view import build_portfolio_view
from app.services.research_engine import ResearchEngine, enrich_positions
from app.store.portfolio_store import PortfolioStore

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


def _validate_shares(shares: float) -> None:
    if shares <= 0:
        raise AppError("shares must be > 0", type="validation_error", status=422)


def _validate_entry_price(price: float) -> None:
    if price <= 0:
        raise AppError("entryPrice must be > 0", type="validation_error", status=422)


def _validate_entry_date(value: str) -> str:
    try:
        return date.fromisoformat(value.strip()).isoformat()
    except ValueError as exc:
        raise AppError(
            "entryDate must be an ISO date (YYYY-MM-DD)", type="validation_error", status=422
        ) from exc


@router.get("", response_model=PortfolioView)
async def get_portfolio(
    store: PortfolioStore = Depends(get_portfolio_store),
    provider: StockDataProvider = Depends(get_raw_provider),
) -> PortfolioView:
    """Live-priced holdings, value-weighted trend slices, totals, and the
    deterministic guardrail alerts (concentration / deterioration / staleness)."""
    positions = await store.list_positions()
    holdings = await enrich_positions(provider, positions)
    research = await store.get_research()
    return build_portfolio_view(holdings, research)


@router.post("/positions", response_model=PortfolioPosition, status_code=201)
async def add_position(
    body: AddPositionRequest,
    store: PortfolioStore = Depends(get_portfolio_store),
    provider: StockDataProvider = Depends(get_raw_provider),
) -> PortfolioPosition:
    """Add a buy-and-hold pick. Entry price/date/shares can be supplied to match
    the real fill; otherwise the entry price is frozen from live market data
    (raw provider: a mock-backfilled entry price would be a lie)."""
    ticker = body.ticker.strip().upper()
    if not ticker:
        raise AppError("Ticker is required", type="validation_error", status=422)

    shares = body.shares if body.shares is not None else 1.0
    _validate_shares(shares)
    if body.entry_price is not None:
        _validate_entry_price(body.entry_price)
    entry_date = _validate_entry_date(body.entry_date) if body.entry_date else None

    # The live quote both validates the ticker exists and provides the default
    # entry price. A manual entryPrice still requires a priceable ticker.
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
        entry_price=body.entry_price if body.entry_price is not None else quote.price,
        entry_date=entry_date or now.date().isoformat(),
        shares=shares,
        trend=(body.trend or "").strip() or None,
        thesis=(body.thesis or "").strip() or None,
        added_at=now.isoformat(),
    )
    await store.add_position(position)  # 409 if already held
    return position


@router.patch("/positions/{ticker}", response_model=PortfolioPosition)
async def update_position(
    ticker: str,
    body: UpdatePositionRequest,
    store: PortfolioStore = Depends(get_portfolio_store),
) -> PortfolioPosition:
    """Edit a stored position (shares / entry price / entry date / trend /
    thesis) without losing its history — only the fields sent are changed."""
    fields: dict[str, Any] = body.model_dump(exclude_unset=True)
    if not fields:
        raise AppError("Nothing to update", type="validation_error", status=422)

    if "shares" in fields and fields["shares"] is not None:
        _validate_shares(fields["shares"])
    if "entry_price" in fields and fields["entry_price"] is not None:
        _validate_entry_price(fields["entry_price"])
    if "entry_date" in fields and fields["entry_date"] is not None:
        fields["entry_date"] = _validate_entry_date(fields["entry_date"])
    # Sending an empty string clears the tag; sending nothing leaves it alone.
    for key in ("trend", "thesis"):
        if key in fields and fields[key] is not None:
            fields[key] = fields[key].strip() or None
    # None for numeric/date fields means "not provided", never "clear".
    for key in ("shares", "entry_price", "entry_date"):
        if key in fields and fields[key] is None:
            del fields[key]
    if not fields:
        raise AppError("Nothing to update", type="validation_error", status=422)

    return await store.update_position(ticker, fields)  # 404 if not held


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
