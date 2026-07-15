"""Abstract market-data provider interface."""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas import HotStock, TickerDetail


class ProviderError(Exception):
    """Raised by real providers on upstream failure (network, rate limit, bad data)."""


class StockDataProvider(ABC):
    """Market-data port. Implementations: mock (offline) and finnhub (real)."""

    @abstractmethod
    async def screen_hot_stocks(self, low: float = 0.50, high: float = 1.00) -> list[HotStock]:
        """Return tickers whose trailing-1yr change is within [low, high]."""

    @abstractmethod
    async def get_quote(self, ticker: str) -> TickerDetail:
        """Return current detail for one ticker. Raises AppError(404) if unknown."""

    @abstractmethod
    async def get_universe(self) -> set[str]:
        """Return all priceable tickers — used to validate LLM-suggested tickers."""
