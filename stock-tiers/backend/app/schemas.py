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
    hot_stock_ticker: str
    thesis: str
    tiers: dict[Tier, list[TierEntry]]
    disclaimer: str
    generated_at: str
