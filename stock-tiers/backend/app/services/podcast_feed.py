"""Podcast RSS 2.0 feed for the daily briefs (Spotify/Apple/Pocket Casts).

Submit the feed URL once to Spotify for Creators (or add it directly as a
private feed in Apple Podcasts / Pocket Casts); each new brief then appears as
an episode automatically.
"""

from __future__ import annotations

from datetime import UTC, datetime
from email.utils import format_datetime
from xml.sax.saxutils import escape

from app.schemas import DailyBrief

_FEED_TITLE = "每日投资简报 · Stock Tiers"
_FEED_DESC = (
    "AI 生成的每日市场简报:股市、金融宏观、地缘政治、行业播客观点与波段研究思路。"
    "内容仅供研究参考,不构成投资建议。"
)


def _rfc822(iso: str) -> str:
    try:
        return format_datetime(datetime.fromisoformat(iso))
    except ValueError:
        return format_datetime(datetime.now(UTC))


def build_podcast_feed(briefs: list[DailyBrief], *, base_url: str) -> str:
    """Render the RSS XML. Only briefs with audio become episodes."""
    base = base_url.rstrip("/")
    items: list[str] = []
    for brief in briefs:
        if not brief.audio_url:
            continue
        audio = f"{base}{brief.audio_url}"
        summary = "; ".join(h.headline for h in brief.highlights) or brief.title
        items.append(
            "<item>"
            f"<title>{escape(brief.title)}</title>"
            f"<description>{escape(summary)}</description>"
            f"<guid isPermaLink=\"false\">stock-tiers-brief-{escape(brief.id)}</guid>"
            f"<pubDate>{escape(_rfc822(brief.generated_at))}</pubDate>"
            f"<enclosure url=\"{escape(audio)}\" type=\"audio/mpeg\" length=\"0\"/>"
            "</item>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">'
        "<channel>"
        f"<title>{escape(_FEED_TITLE)}</title>"
        f"<link>{escape(base)}</link>"
        f"<description>{escape(_FEED_DESC)}</description>"
        "<language>zh-cn</language>"
        "<itunes:explicit>false</itunes:explicit>"
        + "".join(items)
        + "</channel></rss>"
    )
