"""Claude-backed tier-engine service.

Generates an S-F tier list of alternative/downstream stocks for a hot stock,
then validates and enriches every entry against the market-data provider so the
LLM cannot hallucinate prices or non-existent tickers.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from typing import Any

import anthropic

from app.config import Settings
from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.schemas import DISCLAIMER, TIER_ORDER, Tier, TierEntry, TierList
from app.services.tier_cache import TierCache
from app.services.tier_prompt import TIER_SYSTEM_PROMPT, TIER_TOOL, build_user_message

logger = logging.getLogger(__name__)

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

        # 2. Ask Claude for structured output via forced tool use. Claude may
        #    suggest any real US-listed ticker; we verify each below.
        raw = await self._call_claude(
            ticker=ticker,
            name=hot.name,
            sector=hot.sector,
            change_pct=hot.one_year_change_pct,
        )

        # 3. Validate + enrich every entry against the provider (priceable == real).
        thesis = str(raw.get("thesis", "")).strip()
        entries = await self._validate_entries(raw.get("entries", []), exclude=ticker)

        tiers: dict[Tier, list[TierEntry]] = {t: [] for t in TIER_ORDER}
        for entry in entries:
            tiers[entry.tier].append(entry)

        result = TierList(
            hot_stock_ticker=ticker,
            thesis=thesis,
            tiers=tiers,
            disclaimer=DISCLAIMER,
            generated_at=datetime.now(UTC).isoformat(),
        )
        self._cache.set(ticker, model, result)
        return result

    async def _call_claude(
        self,
        *,
        ticker: str,
        name: str,
        sector: str,
        change_pct: float,
    ) -> dict[str, Any]:
        user_message = build_user_message(
            ticker=ticker,
            name=name,
            sector=sector,
            change_pct=change_pct,
        )
        try:
            # The SDK's create() overloads use TypedDict unions; our dict literals
            # (tool with `strict`, system cache_control, output_config) are valid at
            # runtime but don't structurally match in strict mode — ignore at the boundary.
            resp = await self._client.messages.create(  # type: ignore[call-overload]
                model=self._settings.tier_model,
                max_tokens=4096,
                thinking={"type": "adaptive"},
                output_config={"effort": self._settings.tier_effort},
                system=[
                    {
                        "type": "text",
                        "text": TIER_SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                tools=[TIER_TOOL],
                tool_choice={"type": "tool", "name": "emit_tier_list"},
                messages=[{"role": "user", "content": user_message}],
            )
        except anthropic.APIError as exc:  # typed SDK error chain
            logger.warning("anthropic call failed: %s", exc)
            raise AppError("Tier engine unavailable", type="upstream_error", status=502) from exc

        for block in resp.content:
            if getattr(block, "type", None) == "tool_use" and block.name == "emit_tier_list":
                # block.input is already a parsed object — never raw-string-match it.
                return dict(block.input)
        raise AppError("Tier engine returned no result", type="upstream_error", status=502)

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
