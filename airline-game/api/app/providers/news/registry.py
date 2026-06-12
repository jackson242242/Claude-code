"""M4.1 News provider registry.

Reads the NEWS_PROVIDER environment variable and returns the matching provider.

  NEWS_PROVIDER=mock   (default) → MockNewsProvider
  NEWS_PROVIDER=gdelt             → GDELTNewsProvider
"""
from __future__ import annotations

import os

from app.providers.news.base import NewsProvider


def get_news_provider() -> NewsProvider:
    """Return the configured news provider instance.

    Defaults to MockNewsProvider when NEWS_PROVIDER is unset.
    """
    name = os.environ.get("NEWS_PROVIDER", "mock").lower().strip()

    if name == "gdelt":
        from app.providers.news.gdelt import GDELTNewsProvider
        return GDELTNewsProvider()

    # Default: mock
    from app.providers.news.mock import MockNewsProvider
    return MockNewsProvider()
