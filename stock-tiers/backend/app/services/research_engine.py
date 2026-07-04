"""Daily portfolio research engine.

Enriches each stored position with the latest provider price, asks Claude
(+ web search) whether each holding's original thesis is still intact, and
returns a structured report. Research and monitoring only — never advice,
never return promises.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

import anthropic

from app.config import Settings
from app.errors import AppError
from app.providers.base import ProviderError, StockDataProvider
from app.schemas import (
    DISCLAIMER,
    HoldingNote,
    PortfolioHolding,
    PortfolioPosition,
    ResearchReport,
)
from app.services.claude_runner import call_claude_tool
from app.services.research_prompt import (
    RESEARCH_SYSTEM_PROMPT,
    RESEARCH_TOOL,
    build_research_message,
)

_VALID_STATUS = {"strengthening", "intact", "weakening", "broken"}


async def enrich_position(
    provider: StockDataProvider, position: PortfolioPosition
) -> PortfolioHolding:
    """Attach live price + since-entry change; None fields if unpriceable now."""
    current: float | None = None
    one_year: float | None = None
    try:
        quote = await provider.get_quote(position.ticker)
        current = quote.price
        one_year = quote.one_year_change_pct
    except (AppError, ProviderError):
        pass  # market data down / ticker unpriceable today -> show entry data only
    since_entry = (
        (current - position.entry_price) / position.entry_price
        if current is not None and position.entry_price > 0
        else None
    )
    return PortfolioHolding(
        ticker=position.ticker,
        name=position.name,
        entry_price=position.entry_price,
        entry_date=position.entry_date,
        trend=position.trend,
        thesis=position.thesis,
        current_price=current,
        since_entry_pct=since_entry,
        one_year_change_pct=one_year,
    )


async def enrich_positions(
    provider: StockDataProvider, positions: list[PortfolioPosition]
) -> list[PortfolioHolding]:
    return list(await asyncio.gather(*(enrich_position(provider, p) for p in positions)))


def _holding_line(h: PortfolioHolding) -> str:
    price = f"${h.current_price:.2f}" if h.current_price is not None else "n/a"
    since = f" ({h.since_entry_pct:+.0%} since entry)" if h.since_entry_pct is not None else ""
    return (
        f"- {h.ticker} — {h.name} | trend: {h.trend or '(untagged)'} | "
        f"thesis: {h.thesis or '(none recorded)'} | "
        f"entry ${h.entry_price:.2f} on {h.entry_date} | latest {price}{since}"
    )


class ResearchEngine:
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        provider: StockDataProvider,
        settings: Settings,
    ) -> None:
        self._client = client
        self._provider = provider
        self._settings = settings

    async def run(self, positions: list[PortfolioPosition]) -> ResearchReport:
        if not positions:
            raise AppError(
                "Portfolio is empty — add a position first",
                type="empty_portfolio",
                status=400,
            )

        holdings = await enrich_positions(self._provider, positions)
        message = build_research_message(
            holdings_block="\n".join(_holding_line(h) for h in holdings),
            count=len(holdings),
        )
        raw, _stop = await call_claude_tool(
            self._client,
            self._settings,
            system_prompt=RESEARCH_SYSTEM_PROMPT,
            user_message=message,
            emit_tool=RESEARCH_TOOL,
        )

        valid_tickers = {p.ticker.upper() for p in positions}
        notes: list[HoldingNote] = []
        seen: set[str] = set()
        raw_notes: list[Any] = raw.get("notes", [])
        for item in raw_notes:
            if not isinstance(item, dict):
                continue
            ticker = str(item.get("ticker", "")).upper()
            status = item.get("thesisStatus")
            # Notes must map onto actual holdings (anti-hallucination).
            if ticker not in valid_tickers or ticker in seen or status not in _VALID_STATUS:
                continue
            seen.add(ticker)
            notes.append(
                HoldingNote(
                    ticker=ticker,
                    headline=str(item.get("headline", "")).strip(),
                    thesis_status=status,
                    note=str(item.get("note", "")).strip(),
                )
            )

        return ResearchReport(
            summary=str(raw.get("summary", "")).strip(),
            notes=notes,
            diversification=str(raw.get("diversification", "")).strip(),
            generated_at=datetime.now(UTC).isoformat(),
            disclaimer=DISCLAIMER,
        )
