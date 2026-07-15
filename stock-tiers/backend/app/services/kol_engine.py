"""X KOL tracker engine.

Two measurements per handle, updated daily:
1. 报喜率 — of the posts that claim a result, how many claim a GAIN. A ratio
   near 1.0 over many posts is the survivorship-bias signature.
2. 实测胜率 — every concrete trade call gets its entry price FROZEN from live
   market data at first sighting; afterwards the direction-adjusted return is
   computed from real prices. The poster's own claims are never trusted.
"""

from __future__ import annotations

import asyncio
import hashlib
from datetime import UTC, datetime

import anthropic

from app.config import Settings
from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.schemas import KolCall, KolPost, KolScoreboard
from app.services.claude_runner import call_claude_tool
from app.services.kol_prompt import KOL_SYSTEM_PROMPT, KOL_TOOL, build_kol_message

_VALID_POST_TYPES = {"trade_call", "pnl_boast", "market_view", "other"}
_VALID_RESULTS = {"gain", "loss", "neutral", "unknown"}
_VALID_DIRECTIONS = {"long", "short"}
# Keep the stored history bounded per handle.
MAX_POSTS = 200
MAX_CALLS = 100


def post_id(handle: str, excerpt: str, date: str) -> str:
    digest = hashlib.sha256(f"{handle}|{date}|{excerpt}".encode()).hexdigest()
    return digest[:16]


def compute_scoreboard(handle: str, posts: list[KolPost], calls: list[KolCall]) -> KolScoreboard:
    gain = sum(1 for p in posts if p.claimed_result == "gain")
    loss = sum(1 for p in posts if p.claimed_result == "loss")
    claiming = gain + loss
    priced = [c for c in calls if c.return_pct is not None]
    wins = sum(1 for c in priced if c.return_pct is not None and c.return_pct > 0)
    losses = sum(1 for c in priced if c.return_pct is not None and c.return_pct < 0)
    return KolScoreboard(
        handle=handle,
        posts_analyzed=len(posts),
        gain_posts=gain,
        loss_posts=loss,
        boast_gain_ratio=gain / claiming if claiming else None,
        calls_tracked=len(calls),
        wins=wins,
        losses=losses,
        win_rate=wins / len(priced) if priced else None,
        avg_return_pct=(
            sum(c.return_pct for c in priced if c.return_pct is not None) / len(priced)
            if priced
            else None
        ),
        updated_at=datetime.now(UTC).isoformat(),
    )


class KolEngine:
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        provider: StockDataProvider,
        settings: Settings,
    ) -> None:
        self._client = client
        self._provider = provider
        self._settings = settings

    async def scan(
        self,
        *,
        handle: str,
        known_posts: list[KolPost],
    ) -> tuple[str, list[KolPost], list[KolCall]]:
        """One scan pass: returns (summary, new_posts, new_unpriced_calls)."""
        raw, _stop = await call_claude_tool(
            self._client,
            self._settings,
            system_prompt=KOL_SYSTEM_PROMPT,
            user_message=build_kol_message(
                handle=handle,
                date=datetime.now(UTC).date().isoformat(),
                known_excerpts=[p.excerpt for p in known_posts],
            ),
            emit_tool=KOL_TOOL,
        )

        known_ids = {p.id for p in known_posts}
        new_posts: list[KolPost] = []
        for item in raw.get("posts", []):
            if not isinstance(item, dict):
                continue
            excerpt = str(item.get("excerpt", "")).strip()
            date = str(item.get("date", "")).strip()
            if not excerpt:
                continue
            if item.get("postType") not in _VALID_POST_TYPES:
                continue
            if item.get("claimedResult") not in _VALID_RESULTS:
                continue
            pid = post_id(handle, excerpt, date)
            if pid in known_ids:
                continue
            known_ids.add(pid)
            url = str(item.get("url", "")).strip()
            new_posts.append(
                KolPost(
                    id=pid,
                    handle=handle,
                    date=date,
                    url=url or None,
                    excerpt=excerpt[:280],
                    post_type=item["postType"],
                    claimed_result=item["claimedResult"],
                    tickers=[
                        str(t).upper() for t in item.get("tickers", []) if str(t).strip()
                    ][:8],
                )
            )

        raw_calls: list[KolCall] = []
        for item in raw.get("calls", []):
            if not isinstance(item, dict):
                continue
            ticker = str(item.get("ticker", "")).upper().strip()
            if not ticker or item.get("direction") not in _VALID_DIRECTIONS:
                continue
            date = str(item.get("date", "")).strip()
            raw_calls.append(
                KolCall(
                    id=post_id(handle, f"call|{ticker}|{item['direction']}", date),
                    handle=handle,
                    ticker=ticker,
                    direction=item["direction"],
                    date=date,
                    source_excerpt=str(item.get("excerpt", "")).strip()[:280],
                    entry_price=0.0,  # frozen below; 0 sentinel never stored
                )
            )
        return str(raw.get("summary", "")).strip(), new_posts, raw_calls

    async def freeze_new_calls(
        self, raw_calls: list[KolCall], existing: list[KolCall]
    ) -> list[KolCall]:
        """Freeze a REAL entry price for calls not seen before; unpriceable
        tickers are dropped (anti-hallucination, same rule as everywhere)."""
        known = {c.id for c in existing}
        frozen: list[KolCall] = []
        for call in raw_calls:
            if call.id in known:
                continue
            known.add(call.id)
            try:
                quote = await self._provider.get_quote(call.ticker)
            except (AppError, ProviderError):
                continue
            call.entry_price = quote.price
            frozen.append(call)
        return frozen

    async def reprice_calls(self, calls: list[KolCall]) -> list[KolCall]:
        return await reprice_calls(self._provider, calls)


async def reprice_calls(provider: StockDataProvider, calls: list[KolCall]) -> list[KolCall]:
    """Refresh current price + direction-adjusted return for every call.
    Standalone so read endpoints can reprice without needing a Claude client."""

    async def reprice(call: KolCall) -> KolCall:
        try:
            quote = await provider.get_quote(call.ticker)
        except (AppError, ProviderError):
            call.current_price = None
            call.return_pct = None
            return call
        call.current_price = quote.price
        if call.entry_price > 0:
            raw = (quote.price - call.entry_price) / call.entry_price
            call.return_pct = raw if call.direction == "long" else -raw
        return call

    return list(await asyncio.gather(*(reprice(c) for c in calls)))
