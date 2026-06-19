"""Deterministic mock provider backed by the seed universe."""

from __future__ import annotations

from app.errors import AppError
from app.providers.base import StockDataProvider
from app.providers.seed_data import SEED_BY_TICKER, SEED_UNIVERSE
from app.schemas import HotStock, TickerDetail


class MockStockDataProvider(StockDataProvider):
    """Returns fixed seed data — no network, no randomness."""

    async def screen_hot_stocks(self, low: float = 0.50, high: float = 1.00) -> list[HotStock]:
        hits = [
            HotStock(
                ticker=s.ticker,
                name=s.name,
                price=s.price,
                one_year_change_pct=s.one_year_change_pct,
                sector=s.sector,
            )
            for s in SEED_UNIVERSE
            if low <= s.one_year_change_pct <= high
        ]
        # Stable, useful ordering: biggest movers first.
        hits.sort(key=lambda h: h.one_year_change_pct, reverse=True)
        return hits

    async def get_quote(self, ticker: str) -> TickerDetail:
        seed = SEED_BY_TICKER.get(ticker.upper())
        if seed is None:
            raise AppError(f"Unknown ticker: {ticker}", type="not_found", status=404)
        return TickerDetail(
            ticker=seed.ticker,
            name=seed.name,
            price=seed.price,
            one_year_change_pct=seed.one_year_change_pct,
            sector=seed.sector,
            currency=seed.currency,
        )

    async def get_universe(self) -> set[str]:
        return set(SEED_BY_TICKER.keys())
