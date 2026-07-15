"""Deterministic seed universe for the mock provider.

Hand-curated tickers across several theses, with fixed prices, sectors, and
trailing-1yr changes. Several sit inside the +50%-100% "hot" band so the
screener returns realistic results fully offline. No randomness -> tests can
assert exact values.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SeedTicker:
    ticker: str
    name: str
    sector: str
    price: float
    one_year_change_pct: float  # e.g. 0.62 == +62%
    currency: str = "USD"


# fmt: off
SEED_UNIVERSE: tuple[SeedTicker, ...] = (
    # --- AI / semiconductors (the canonical "hot" thesis) ---
    SeedTicker("NVDA", "NVIDIA Corporation", "Semiconductors", 178.34, 0.74),
    SeedTicker("AMD", "Advanced Micro Devices", "Semiconductors", 168.20, 0.58),
    SeedTicker("AVGO", "Broadcom Inc.", "Semiconductors", 232.10, 0.69),
    SeedTicker("TSM", "Taiwan Semiconductor", "Semiconductors", 205.55, 0.81),
    SeedTicker("ARM", "Arm Holdings", "Semiconductors", 142.90, 0.55),
    SeedTicker("MRVL", "Marvell Technology", "Semiconductors", 118.40, 0.92),
    SeedTicker("MU", "Micron Technology", "Semiconductors", 124.75, 0.66),
    SeedTicker("INTC", "Intel Corporation", "Semiconductors", 24.10, 0.12),
    # --- Power / cooling / datacenter infrastructure (downstream of AI) ---
    SeedTicker("VRT", "Vertiv Holdings", "Industrials", 138.60, 0.88),
    SeedTicker("ETN", "Eaton Corporation", "Industrials", 372.40, 0.41),
    SeedTicker("PWR", "Quanta Services", "Industrials", 348.90, 0.63),
    SeedTicker("GEV", "GE Vernova", "Utilities", 512.30, 0.97),
    SeedTicker("CEG", "Constellation Energy", "Utilities", 298.70, 0.78),
    SeedTicker("VST", "Vistra Corp", "Utilities", 168.25, 0.85),
    SeedTicker("SMCI", "Super Micro Computer", "Technology", 48.90, 0.31),
    SeedTicker("DELL", "Dell Technologies", "Technology", 142.10, 0.49),
    # --- Energy ---
    SeedTicker("XOM", "Exxon Mobil", "Energy", 118.40, 0.09),
    SeedTicker("FANG", "Diamondback Energy", "Energy", 182.30, 0.21),
    SeedTicker("LNG", "Cheniere Energy", "Energy", 232.80, 0.52),
    # --- EV / mobility ---
    SeedTicker("TSLA", "Tesla, Inc.", "Automotive", 412.60, 0.71),
    SeedTicker("RIVN", "Rivian Automotive", "Automotive", 18.40, 0.34),
    SeedTicker("ALB", "Albemarle Corporation", "Materials", 96.20, -0.08),
    # --- Biotech / pharma ---
    SeedTicker("LLY", "Eli Lilly", "Healthcare", 842.10, 0.33),
    SeedTicker("VKTX", "Viking Therapeutics", "Healthcare", 78.50, 0.64),
    SeedTicker("NVO", "Novo Nordisk", "Healthcare", 108.30, -0.12),
    # --- Fintech / crypto-adjacent ---
    SeedTicker("COIN", "Coinbase Global", "Financials", 312.40, 0.83),
    SeedTicker("HOOD", "Robinhood Markets", "Financials", 58.20, 0.94),
    SeedTicker("SQ", "Block, Inc.", "Financials", 92.10, 0.27),
    SeedTicker("MSTR", "MicroStrategy", "Technology", 388.70, 0.96),
    # --- Big tech / software ---
    SeedTicker("MSFT", "Microsoft Corporation", "Technology", 438.20, 0.18),
    SeedTicker("GOOGL", "Alphabet Inc.", "Technology", 198.40, 0.36),
    SeedTicker("META", "Meta Platforms", "Technology", 612.50, 0.53),
    SeedTicker("PLTR", "Palantir Technologies", "Technology", 82.40, 0.99),
    SeedTicker("NOW", "ServiceNow", "Technology", 1042.10, 0.29),
    SeedTicker("CRWD", "CrowdStrike Holdings", "Technology", 372.80, 0.47),
    SeedTicker("NET", "Cloudflare", "Technology", 142.60, 0.61),
    # --- Industrials / other ---
    SeedTicker("CAT", "Caterpillar Inc.", "Industrials", 398.20, 0.24),
    SeedTicker("DE", "Deere & Company", "Industrials", 462.10, 0.16),
    SeedTicker("GE", "General Electric", "Industrials", 198.70, 0.57),
    SeedTicker("UBER", "Uber Technologies", "Technology", 78.90, 0.38),
)
# fmt: on

SEED_BY_TICKER: dict[str, SeedTicker] = {s.ticker: s for s in SEED_UNIVERSE}
