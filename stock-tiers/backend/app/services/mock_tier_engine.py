"""Deterministic, zero-secret tier engine for the demo / prototype.

Builds an S-F tier list from the seed universe without any LLM call, so the
full flow (hot stock -> tiers -> detail) works with no API keys. Selection is
purely a function of sector relationship + 1-year momentum, so it is stable and
reproducible. Prices/changes are still enriched from the active market-data
provider, mirroring the real engine.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime

from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.providers.seed_data import SEED_UNIVERSE
from app.schemas import (
    DISCLAIMER,
    TIER_ORDER,
    Relationship,
    Tier,
    TierEntry,
    TierList,
)

# Which sectors are "downstream" of / adjacent to a given sector. Same-sector
# names are "alternatives"; adjacent-sector names are "downstream".
_SECTOR_ADJACENCY: dict[str, set[str]] = {
    "Semiconductors": {"Technology", "Industrials", "Utilities"},
    "Technology": {"Semiconductors", "Industrials", "Utilities"},
    "Industrials": {"Utilities", "Materials", "Semiconductors", "Technology"},
    "Utilities": {"Industrials", "Energy", "Semiconductors"},
    "Energy": {"Utilities", "Materials"},
    "Automotive": {"Materials", "Technology", "Semiconductors"},
    "Materials": {"Industrials", "Automotive", "Energy"},
    "Financials": {"Technology"},
    "Healthcare": set(),
}

# Curated thesis lines for marquee hot stocks; generic fallback otherwise.
_THESIS: dict[str, str] = {
    "NVDA": (
        "The AI compute buildout: surging demand for accelerated computing and "
        "the power, cooling, and datacenter infrastructure that supports it."
    ),
    "AMD": "High-performance AI and datacenter silicon as an NVIDIA alternative.",
    "AVGO": "AI networking and custom-silicon demand across hyperscale datacenters.",
    "TSM": "The foundry powering the entire AI-compute supply chain.",
    "TSLA": "EV adoption plus an energy-storage and autonomy platform.",
    "COIN": "Crypto adoption and the infrastructure of digital-asset markets.",
    "PLTR": "Enterprise and government adoption of applied-AI software platforms.",
    "GEV": "Electrification and grid buildout to power AI datacenters and EVs.",
    "VRT": "Datacenter power and thermal management for the AI compute wave.",
}


class MockTierEngine:
    """Deterministic tier engine used when no Anthropic key is configured."""

    def __init__(self, provider: StockDataProvider) -> None:
        self._provider = provider

    async def generate(self, hot_stock_ticker: str) -> TierList:
        ticker = hot_stock_ticker.upper()
        hot = await self._provider.get_quote(ticker)
        thesis = _THESIS.get(
            ticker,
            f"Capturing the same momentum that drove {hot.name} ({hot.sector}) "
            f"sharply higher over the past year.",
        )

        adjacent = _SECTOR_ADJACENCY.get(hot.sector, set())
        chosen: list[tuple[str, Tier, Relationship]] = []

        for seed in SEED_UNIVERSE:
            if seed.ticker == ticker:
                continue
            if seed.sector == hot.sector:
                relationship: Relationship = "alternative"
                rel_weight = 1.0
            elif seed.sector in adjacent:
                relationship = "downstream"
                rel_weight = 0.6
            else:
                continue  # keep the list focused on the thesis

            momentum = max(0.0, min(1.0, seed.one_year_change_pct))
            score = 0.6 * rel_weight + 0.4 * momentum
            chosen.append((seed.ticker, _bucket(score), relationship))

        # Enrich each chosen ticker against the provider (price/change source of truth).
        async def enrich(tk: str, tier: Tier, rel: Relationship) -> TierEntry | None:
            try:
                detail = await self._provider.get_quote(tk)
            except (AppError, ProviderError):
                return None
            return TierEntry(
                ticker=detail.ticker,
                name=detail.name,
                price=detail.price,
                one_year_change_pct=detail.one_year_change_pct,
                tier=tier,
                relationship=rel,
                rationale=_rationale(detail.name, detail.sector, rel),
                tier_justification=_justification(tier, detail.one_year_change_pct),
            )

        enriched = await asyncio.gather(*(enrich(tk, ti, rel) for tk, ti, rel in chosen))

        tiers: dict[Tier, list[TierEntry]] = {t: [] for t in TIER_ORDER}
        for entry in enriched:
            if entry is not None:
                tiers[entry.tier].append(entry)
        for bucket in tiers.values():
            bucket.sort(key=lambda e: e.one_year_change_pct, reverse=True)

        return TierList(
            hot_stock_ticker=ticker,
            thesis=thesis,
            tiers=tiers,
            disclaimer=DISCLAIMER,
            generated_at=datetime.now(UTC).isoformat(),
        )


def _bucket(score: float) -> Tier:
    if score >= 0.85:
        return "S"
    if score >= 0.72:
        return "A"
    if score >= 0.58:
        return "B"
    if score >= 0.45:
        return "C"
    if score >= 0.32:
        return "D"
    return "F"


def _rationale(name: str, sector: str, rel: Relationship) -> str:
    # Honest about being heuristic: the mock engine only knows sector + momentum,
    # NOT real business relationships. Set ANTHROPIC_API_KEY for Claude-reasoned,
    # concretely-explained connections.
    if rel == "alternative":
        return (
            f"Same sector ({sector}) — illustrative peer only (offline mock data, "
            f"not a verified business relationship)."
        )
    return (
        f"Adjacent sector ({sector}) — illustrative thematic link only (offline mock "
        f"data, not a verified value-chain connection)."
    )


def _justification(tier: Tier, change: float) -> str:
    return f"Tier {tier}: heuristic sector fit + a {change * 100:+.0f}% one-year move (mock)."
