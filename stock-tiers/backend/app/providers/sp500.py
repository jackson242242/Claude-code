"""A bundled candidate symbol list for the Finnhub screener.

Finnhub has no native "up 50-100%" endpoint, so the screener iterates a fixed
candidate universe and filters by computed trailing-1yr change. This is a
representative large-cap slice (not the full index) to keep API-call volume and
rate-limit pressure manageable; expand as needed.
"""

from __future__ import annotations

SP500_CANDIDATES: tuple[str, ...] = (
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AVGO", "AMD", "TSM",
    "ARM", "MRVL", "MU", "INTC", "SMCI", "DELL", "QCOM", "TXN", "ADI", "LRCX",
    "VRT", "ETN", "PWR", "GEV", "CEG", "VST", "NEE", "DUK", "SO", "XOM",
    "CVX", "FANG", "LNG", "COP", "SLB", "TSLA", "RIVN", "LCID", "ALB", "GM",
    "F", "LLY", "VKTX", "NVO", "MRK", "PFE", "ABBV", "UNH", "JNJ", "COIN",
    "HOOD", "SQ", "MSTR", "PYPL", "V", "MA", "JPM", "GS", "BAC", "WFC",
    "PLTR", "NOW", "CRWD", "NET", "SNOW", "DDOG", "ORCL", "CRM", "ADBE", "UBER",
    "CAT", "DE", "GE", "HON", "BA", "RTX", "LMT", "MMM", "EMR", "ROK",
)
