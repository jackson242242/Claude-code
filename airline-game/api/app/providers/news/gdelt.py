"""M4.1 GDELT news provider.

Uses the GDELT DOC API v2 ArtList JSON format to fetch recent aviation news.
Aviation query terms: aviation OR airline OR "jet fuel" OR airport
timespan=6h, maxrecords=30.

Any HTTP or parsing failure returns [] and is never re-raised to the caller.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from app.providers.news.base import NewsArticle

logger = logging.getLogger(__name__)

_GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
_QUERY = "(aviation OR airline OR \"jet fuel\" OR airport)"
_TIMESPAN = "6h"
_MAXRECORDS = 30


class GDELTNewsProvider:
    """Fetches aviation news via the GDELT DOC API ArtList format."""

    def __init__(self, timeout: float = 15.0) -> None:
        self._timeout = timeout

    def fetch_articles(self) -> list[NewsArticle]:
        """Fetch up to 30 aviation articles from the last 6 hours.

        Returns [] on any error — never raises.
        """
        try:
            return self._fetch()
        except Exception as exc:
            logger.warning("GDELTNewsProvider: fetch failed: %s", exc)
            return []

    def _fetch(self) -> list[NewsArticle]:
        params = {
            "query": _QUERY,
            "mode": "ArtList",
            "format": "json",
            "timespan": _TIMESPAN,
            "maxrecords": str(_MAXRECORDS),
            "sort": "DateDesc",
        }
        with httpx.Client(timeout=self._timeout) as client:
            response = client.get(_GDELT_URL, params=params)

        if response.status_code != 200:
            logger.warning(
                "GDELTNewsProvider: HTTP %d from GDELT API", response.status_code
            )
            return []

        data = response.json()
        articles_raw = data.get("articles") or []
        articles: list[NewsArticle] = []

        for item in articles_raw:
            try:
                article = self._parse_article(item)
                if article is not None:
                    articles.append(article)
            except Exception:
                # Skip malformed individual items
                continue

        return articles

    def _parse_article(self, item: dict) -> NewsArticle | None:
        """Parse one GDELT ArtList article record.

        GDELT ArtList fields: url, title, seendate, domain, language,
        sourcecountry, socialimage, etc.
        """
        url = item.get("url", "").strip()
        title = item.get("title", "").strip()
        if not url or not title:
            return None

        # GDELT seendate format: "20260610T120000Z" or "YYYYMMDDTHHMMSSZ"
        seendate = item.get("seendate", "")
        published_at = _parse_gdelt_date(seendate)

        # Body comes from 'socialimage' alt text or summary — GDELT ArtList
        # doesn't include full article text; use title as body fallback.
        body = item.get("summary") or title

        return NewsArticle(
            url=url,
            title=title,
            body=body,
            published_at=published_at,
        )


def _parse_gdelt_date(seendate: str) -> datetime:
    """Parse GDELT date strings like '20260610T120000Z' → datetime.

    Falls back to current UTC time on parse error.
    """
    try:
        # Strip trailing Z and parse
        clean = seendate.rstrip("Z")
        # Format: YYYYMMDDTHHMMSS
        return datetime.strptime(clean, "%Y%m%dT%H%M%S").replace(
            tzinfo=timezone.utc
        )
    except (ValueError, AttributeError):
        return datetime.now(tz=timezone.utc)
