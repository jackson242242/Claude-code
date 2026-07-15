"""Claude-backed tier-engine service.

Generates an S-F tier list of alternative/downstream stocks for a hot stock,
then validates and enriches every entry against the market-data provider so the
LLM cannot hallucinate prices or non-existent tickers.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

import anthropic

from app.config import Settings
from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.schemas import DISCLAIMER, TIER_ORDER, Tier, TierEntry, TierList
from app.services.claude_runner import call_claude_tool
from app.services.tier_cache import TierCache
from app.services.tier_prompt import (
    TIER_SYSTEM_PROMPT,
    TIER_TOOL,
    build_thesis_message,
    build_user_message,
)

_VALID_TIERS = set(TIER_ORDER)
_VALID_RELATIONSHIPS = {"alternative", "downstream"}


class TierEngine:
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        provider: StockDataProvider,
        cache: TierCache,
        settings: Settings,
    ) -> None:
        self._client = client
        self._provider = provider
        self._cache = cache
        self._settings = settings

    async def generate(self, hot_stock_ticker: str) -> TierList:
        ticker = hot_stock_ticker.upper()
        model = self._settings.tier_model

        cached = self._cache.get(ticker, model)
        if cached is not None:
            return cached

        # 1. Look up the hot stock from the real market-data provider.
        try:
            hot = await self._provider.get_quote(ticker)
        except ProviderError as exc:
            raise AppError(
                "Couldn't fetch the hot stock from market data",
                type="upstream_error",
                status=502,
            ) from exc

        # 2. Ask Claude for structured output. Claude may suggest any real
        #    US-listed ticker; we verify each below.
        message = build_user_message(
            ticker=ticker, name=hot.name, sector=hot.sector, change_pct=hot.one_year_change_pct
        )
        raw, _stop = await self._call_claude(message)

        # 3. Validate + enrich every entry against the provider (priceable == real).
        thesis = str(raw.get("thesis", "")).strip()
        entries = await self._validate_entries(raw.get("entries", []), exclude=ticker)

        result = self._assemble(hot_stock_ticker=ticker, thesis=thesis, entries=entries)
        self._cache.set(ticker, model, result)
        return result

    async def generate_from_thesis(self, thesis_text: str, horizon: str) -> TierList:
        """Thesis mode: the user's free-form thesis is the anchor (no hot stock)."""
        model = self._settings.tier_model
        cache_key = f"THESIS|{horizon}|{thesis_text.strip()}"
        cached = self._cache.get(cache_key, model)
        if cached is not None:
            return cached

        message = build_thesis_message(thesis=thesis_text, horizon=horizon)
        raw, _stop = await self._call_claude(message)
        thesis = str(raw.get("thesis", "")).strip() or thesis_text.strip()
        entries = await self._validate_entries(raw.get("entries", []), exclude="")

        result = self._assemble(hot_stock_ticker=None, thesis=thesis, entries=entries)
        self._cache.set(cache_key, model, result)
        return result

    def _assemble(
        self, *, hot_stock_ticker: str | None, thesis: str, entries: list[TierEntry]
    ) -> TierList:
        tiers: dict[Tier, list[TierEntry]] = {t: [] for t in TIER_ORDER}
        for entry in entries:
            tiers[entry.tier].append(entry)
        return TierList(
            hot_stock_ticker=hot_stock_ticker,
            thesis=thesis,
            tiers=tiers,
            disclaimer=DISCLAIMER,
            generated_at=datetime.now(UTC).isoformat(),
        )

    async def _call_claude(self, user_message: str) -> tuple[dict[str, Any], str | None]:
        # Shared runner: adaptive thinking, cached system prompt, optional web
        # search with the pause_turn continuation loop (see claude_runner).
        return await call_claude_tool(
            self._client,
            self._settings,
            system_prompt=TIER_SYSTEM_PROMPT,
            user_message=user_message,
            emit_tool=TIER_TOOL,
        )

    async def _validate_entries(
        self, raw_entries: list[Any], *, exclude: str
    ) -> list[TierEntry]:
        # De-dup and drop the hot stock itself. Validity is decided by whether the
        # ticker is priceable by the real provider below — NOT by a fixed list — so
        # Claude can recommend any real US-listed ticker, while invented/delisted
        # ones (which can't be priced) are dropped.
        candidates: dict[str, dict[str, Any]] = {}
        for item in raw_entries:
            if not isinstance(item, dict):
                continue
            tk = str(item.get("ticker", "")).upper()
            tier = item.get("tier")
            rel = item.get("relationship")
            if not tk or tk == exclude:
                continue
            if tier not in _VALID_TIERS or rel not in _VALID_RELATIONSHIPS:
                continue
            candidates.setdefault(tk, item)

        async def enrich(tk: str, item: dict[str, Any]) -> TierEntry | None:
            try:
                detail = await self._provider.get_quote(tk)
            except (AppError, ProviderError):
                return None  # not priceable / upstream error -> drop (anti-hallucination)
            return TierEntry(
                ticker=detail.ticker,
                name=detail.name,
                price=detail.price,  # always provider-sourced, never the LLM's number
                one_year_change_pct=detail.one_year_change_pct,
                tier=item["tier"],
                relationship=item["relationship"],
                rationale=str(item.get("rationale", "")).strip(),
                tier_justification=str(item.get("tierJustification", "")).strip(),
            )

        enriched = await asyncio.gather(*(enrich(tk, it) for tk, it in candidates.items()))
        return [e for e in enriched if e is not None]

    async def generate_debug(self, hot_stock_ticker: str) -> dict[str, Any]:
        """Diagnostic: report how many entries Claude returned vs. how many
        survived market-data validation, and which tickers were dropped."""
        ticker = hot_stock_ticker.upper()
        hot = await self._provider.get_quote(ticker)
        message = build_user_message(
            ticker=ticker, name=hot.name, sector=hot.sector, change_pct=hot.one_year_change_pct
        )
        raw, stop_reason = await self._call_claude(message)
        raw_entries = raw.get("entries", [])
        suggested = [
            str(e.get("ticker", "")).upper()
            for e in raw_entries
            if isinstance(e, dict) and e.get("ticker")
        ]
        kept = await self._validate_entries(raw_entries, exclude=ticker)
        kept_tickers = [e.ticker for e in kept]
        dropped = [t for t in suggested if t not in kept_tickers and t != ticker]
        return {
            "ticker": ticker,
            "thesisPresent": bool(str(raw.get("thesis", "")).strip()),
            "stopReason": stop_reason,
            "claudeEntryCount": len(raw_entries),
            "suggested": suggested,
            "keptCount": len(kept_tickers),
            "kept": kept_tickers,
            "dropped": dropped,
        }
