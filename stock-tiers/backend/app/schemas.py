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


class PortfolioPosition(ApiModel):
    """A buy-and-hold pick as stored: entry price is frozen at add time."""

    ticker: str
    name: str
    entry_price: float
    entry_date: str  # ISO date the position was added
    trend: str | None = None
    thesis: str | None = None
    added_at: str


class PortfolioHolding(ApiModel):
    """A stored position enriched with live market data (None if unavailable)."""

    ticker: str
    name: str
    entry_price: float
    entry_date: str
    trend: str | None = None
    thesis: str | None = None
    current_price: float | None = None
    since_entry_pct: float | None = None
    one_year_change_pct: float | None = None


class TrendSlice(ApiModel):
    """Share of the portfolio expressing one secular trend (count-based)."""

    trend: str
    tickers: list[str]
    weight_pct: float


class PortfolioView(ApiModel):
    holdings: list[PortfolioHolding]
    trend_slices: list[TrendSlice]
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
