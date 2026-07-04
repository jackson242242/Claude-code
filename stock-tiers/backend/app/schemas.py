"""Pydantic models — the camelCase JSON wire contract.

Python fields are snake_case; serialized JSON is camelCase via the alias
generator, mapping 1:1 onto the TypeScript types in app/src/api/types.ts.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

Tier = Literal["S", "A", "B", "C", "D", "F"]
Relationship = Literal["alternative", "downstream"]
Horizon = Literal["short", "medium", "long"]
TIER_ORDER: tuple[Tier, ...] = ("S", "A", "B", "C", "D", "F")

DISCLAIMER = (
    "This is not financial advice. Tier rankings are AI-generated and for "
    "informational and educational purposes only. Do your own research before "
    "making any investment decision."
)


class ApiModel(BaseModel):
    """Base model: snake_case in Python, camelCase on the wire."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class HotStock(ApiModel):
    ticker: str
    name: str
    price: float
    one_year_change_pct: float
    sector: str


class TickerDetail(ApiModel):
    ticker: str
    name: str
    price: float
    one_year_change_pct: float
    sector: str
    currency: str


class TierListRequest(ApiModel):
    hot_stock_ticker: str


class ThesisRequest(ApiModel):
    thesis: str
    horizon: Horizon = "long"


class TierEntry(ApiModel):
    ticker: str
    name: str
    price: float
    one_year_change_pct: float
    tier: Tier
    relationship: Relationship
    rationale: str
    tier_justification: str


class TierList(ApiModel):
    # Set in hot-stock mode; None in thesis mode (the thesis itself is the anchor).
    hot_stock_ticker: str | None = None
    thesis: str
    tiers: dict[Tier, list[TierEntry]]
    disclaimer: str
    generated_at: str


# --- Long-term portfolio + daily research + secular trends -------------------

ThesisStatus = Literal["strengthening", "intact", "weakening", "broken"]


class AddPositionRequest(ApiModel):
    ticker: str
    # Secular-trend label this pick expresses (used for diversification view).
    trend: str | None = None
    # The thesis text the pick came from, if any.
    thesis: str | None = None
    # Real position size; defaults to 1 share.
    shares: float | None = None
    # Manual fill price/date (match your real trade); default: live price + today.
    entry_price: float | None = None
    entry_date: str | None = None  # ISO date


class UpdatePositionRequest(ApiModel):
    """Partial edit of a stored position — only the fields sent are changed."""

    shares: float | None = None
    entry_price: float | None = None
    entry_date: str | None = None
    trend: str | None = None
    thesis: str | None = None


class PortfolioPosition(ApiModel):
    """A buy-and-hold pick as stored: entry price is frozen at add time
    (or supplied manually to match the real fill)."""

    ticker: str
    name: str
    entry_price: float
    entry_date: str  # ISO date of the (real or recorded) entry
    shares: float = 1.0
    trend: str | None = None
    thesis: str | None = None
    added_at: str


class PortfolioHolding(ApiModel):
    """A stored position enriched with live market data (None if unavailable)."""

    ticker: str
    name: str
    entry_price: float
    entry_date: str
    shares: float = 1.0
    trend: str | None = None
    thesis: str | None = None
    current_price: float | None = None
    since_entry_pct: float | None = None
    one_year_change_pct: float | None = None
    cost_basis: float = 0.0
    market_value: float | None = None
    pnl: float | None = None
    # Share of total portfolio value; filled in by the view builder.
    weight_pct: float | None = None


class TrendSlice(ApiModel):
    """Share of the portfolio expressing one secular trend (value-weighted)."""

    trend: str
    tickers: list[str]
    weight_pct: float


class PortfolioAlert(ApiModel):
    """A manager-style guardrail flag (concentration, stale research, ...)."""

    level: Literal["info", "warning"]
    message: str


class PortfolioView(ApiModel):
    holdings: list[PortfolioHolding]
    trend_slices: list[TrendSlice]
    total_cost: float
    total_value: float
    total_pnl: float
    total_pnl_pct: float | None = None
    alerts: list[PortfolioAlert]
    disclaimer: str
    generated_at: str


class SecularTrend(ApiModel):
    """A multi-year structural direction the portfolio can diversify into.

    `thesis` is written in the same shape a user would type on the home screen,
    so it feeds POST /api/tiers/thesis directly.
    """

    id: str
    name: str
    category: str
    thesis: str
    why_now: str
    horizon: Horizon = "long"
    discovered_at: str


class HoldingNote(ApiModel):
    ticker: str
    headline: str
    thesis_status: ThesisStatus
    note: str


class ResearchReport(ApiModel):
    """Daily research pass over the portfolio: notes per holding + a
    diversification read across the tagged trends. Research, NOT advice."""

    summary: str
    notes: list[HoldingNote]
    diversification: str
    generated_at: str
    disclaimer: str
