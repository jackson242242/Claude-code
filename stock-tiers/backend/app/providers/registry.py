"""Provider factory: composes Cached(TTL) -> Resilient(real, fallback=mock) -> Primary."""

from __future__ import annotations

import logging

from app.config import Settings
from app.providers.base import StockDataProvider
from app.providers.mock import MockStockDataProvider
from app.providers.wrappers import CachedProvider, ResilientProvider

logger = logging.getLogger(__name__)


def build_stock_provider(settings: Settings) -> StockDataProvider:
    """Build the provider stack from settings. Called once at startup."""
    primary: StockDataProvider
    is_real = False

    if settings.stock_provider == "finnhub":
        if settings.finnhub_api_key:
            # Imported lazily so the mock path needs no httpx-backed code loaded.
            from app.providers.finnhub import FinnhubStockDataProvider

            primary = FinnhubStockDataProvider(settings.finnhub_api_key)
            is_real = True
        else:
            logger.warning("STOCK_PROVIDER=finnhub but FINNHUB_API_KEY is unset; using mock")
            primary = MockStockDataProvider()
    else:
        primary = MockStockDataProvider()

    if is_real and settings.resilient_fallback:
        primary = ResilientProvider(primary, MockStockDataProvider())

    return CachedProvider(
        primary,
        quote_ttl=settings.quote_cache_ttl,
        screener_ttl=settings.screener_cache_ttl,
    )
