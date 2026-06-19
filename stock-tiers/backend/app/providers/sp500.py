"""Candidate symbol list for the Finnhub screener.

Finnhub has no native "up 50-100%" endpoint, so the screener iterates this fixed
candidate universe and filters by the computed trailing-1yr return. Kept to a
focused large-cap slice so the first (uncached) screen stays near the free-tier
~60 calls/min limit; the provider slices it to SCREENER_CANDIDATE_LIMIT.
"""

from __future__ import annotations

SP500_CANDIDATES: tuple[str, ...] = (
    # AI / semiconductors
    "NVDA", "AMD", "AVGO", "TSM", "ARM", "MRVL", "MU", "SMCI", "DELL",
    # power / datacenter / utilities (AI downstream)
    "VRT", "ETN", "PWR", "GEV", "CEG", "VST",
    # big tech / software
    "MSFT", "GOOGL", "META", "AMZN", "PLTR", "NOW", "CRWD", "NET", "ORCL",
    # energy
    "XOM", "LNG", "FANG",
    # EV / mobility
    "TSLA", "RIVN", "UBER",
    # fintech / crypto-adjacent
    "COIN", "HOOD", "MSTR",
    # healthcare
    "LLY", "VKTX",
    # industrials
    "CAT", "DE", "GE",
)
