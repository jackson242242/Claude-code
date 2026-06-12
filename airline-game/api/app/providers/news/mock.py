"""M4.1 Mock news provider — deterministic fixture articles for tests.

Returns the same list every call so tests stay repeatable.
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.providers.news.base import NewsArticle


# Fixed reference time so the fixture is fully deterministic.
_REF_TIME = datetime(2026, 6, 10, 12, 0, 0, tzinfo=timezone.utc)


_FIXTURE_ARTICLES: list[NewsArticle] = [
    NewsArticle(
        url="https://example.com/news/fuel-prices-rise",
        title="Jet Fuel Prices Surge 15% on Supply Disruptions",
        body=(
            "Aviation fuel prices climbed sharply this week after a major refinery "
            "in the Gulf Coast reported unexpected maintenance shutdowns. Airlines "
            "are bracing for significantly higher operating costs in the coming quarter."
        ),
        published_at=_REF_TIME,
    ),
    NewsArticle(
        url="https://example.com/news/heathrow-expansion",
        title="Heathrow Airport Announces Third Runway Construction Start",
        body=(
            "London Heathrow has broken ground on its long-awaited third runway, "
            "with slot capacity expected to increase by 40% upon completion. "
            "Slot fees are projected to rise during the construction period."
        ),
        published_at=_REF_TIME,
    ),
    NewsArticle(
        url="https://example.com/news/travel-demand-recovery",
        title="Global Air Travel Demand Hits Post-Pandemic Record",
        body=(
            "IATA reports that international air passenger numbers have surpassed "
            "2019 levels for the first time, driven by strong leisure travel demand "
            "in the Asia-Pacific and transatlantic markets."
        ),
        published_at=_REF_TIME,
    ),
    NewsArticle(
        url="https://example.com/news/aviation-strike",
        title="European Airport Workers Plan Two-Week Strike",
        body=(
            "Ground handling workers at major European hubs including Frankfurt and "
            "Paris have announced strike action over wage disputes, threatening "
            "significant flight disruptions across the continent."
        ),
        published_at=_REF_TIME,
    ),
    NewsArticle(
        url="https://example.com/news/new-aircraft-deliveries",
        title="Boeing 777X Receives Type Certificate, Deliveries to Begin",
        body=(
            "The FAA has granted type certification to the Boeing 777X, clearing "
            "the way for airlines to take delivery of the long-range widebody jet. "
            "The aircraft offers 20% better fuel efficiency than its predecessors."
        ),
        published_at=_REF_TIME,
    ),
]


class MockNewsProvider:
    """Deterministic fixture provider — always returns the same 5 articles."""

    def fetch_articles(self) -> list[NewsArticle]:
        return list(_FIXTURE_ARTICLES)
