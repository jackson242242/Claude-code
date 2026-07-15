"""Provider factory: composes Cached(TTL) -> Resilient(real, fallback=mock) -> Primary."""

from __future__ import annotations

import logging

from app.config import Settings
from app.providers.base import StockDataProvider
from app.providers.mock import MockStockDataProvider
from app.providers.wrappers import CachedProvider, ResilientProvider

logger = logging.getLogger(__name__)


def build_primary(settings: Settings) -> tuple[StockDataProvider, bool]:
    """Return the bare primary provider and whether it's the real (Finnhub) one."""
    if settings.stock_provider == "finnhub":
        if settings.finnhub_api_key:
            # Imported lazily so the mock path needs no httpx-backed code loaded.
            from app.providers.finnhub import FinnhubStockDataProvider

            return (
                FinnhubStockDataProvider(
                    settings.finnhub_api_key,
                    candidate_limit=settings.screener_candidate_limit,
                ),
                True,
            )
        logger.warning("STOCK_PROVIDER=finnhub but FINNHUB_API_KEY is unset; using mock")
    return MockStockDataProvider(), False


def wrap_provider(
    primary: StockDataProvider, is_real: bool, settings: Settings
) -> StockDataProvider:
    """Wrap the primary as Cached(TTL) -> Resilient(real, fallback=mock) -> Primary."""
    if is_real and settings.resilient_fallback:
        primary = ResilientProvider(primary, MockStockDataProvider())
    return CachedProvider(
        primary,
        quote_ttl=settings.quote_cache_ttl,
        screener_ttl=settings.screener_cache_ttl,
    )


def build_stock_provider(settings: Settings) -> StockDataProvider:
    """Build the full provider stack from settings. Called once at startup."""
    primary, is_real = build_primary(settings)
    return wrap_provider(primary, is_real, settings)
