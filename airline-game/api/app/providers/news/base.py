"""M4.1 News provider abstraction.

NewsArticle is a plain dataclass representing one fetched article.
NewsProvider is a Protocol — any class with a matching fetch_articles()
method satisfies it without explicit inheritance.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass
class NewsArticle:
    """One news article returned by a provider."""

    url: str
    title: str
    body: str
    published_at: datetime


class NewsProvider(Protocol):
    """Protocol satisfied by any news provider implementation."""

    def fetch_articles(self) -> list[NewsArticle]:
        """Fetch recent aviation-related articles.

        Implementations must never raise — return [] on any error.
        """
        ...
