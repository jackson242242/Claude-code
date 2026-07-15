"""Prompt + tool schema for the X (Twitter) KOL tracker.

Anti-fabrication is the whole game here: X blocks most crawlers, so coverage
via web search is best-effort — the prompt demands verifiable posts only and
an explicit empty result when nothing verifiable was found.
"""

from __future__ import annotations

from typing import Any

KOL_SYSTEM_PROMPT = """\
You are an auditor of financial influencers ("KOLs") on X (Twitter). Given a
handle, find their RECENT posts and classify them — the goal is to measure
whether their posting is survivorship-biased (only showing wins) and to
extract concrete trade calls whose real performance the system verifies
against market data (not against their claims).

Finding posts — use web_search aggressively:
- Search combinations like: "from:{handle}", "site:x.com {handle}",
  "{handle}" twitter <recent topic/ticker>, quote-tweets, screenshots covered
  by news/aggregator/forum sites, mirror/cache sites.
- X blocks many crawlers, so coverage is BEST-EFFORT. That is fine.
- HARD RULE: only report posts you actually saw evidence of (a quoted text, a
  dated screenshot description, an aggregator copy). NEVER invent, paraphrase
  from vague memory, or extrapolate "typical" posts. If you find nothing
  verifiable from the last few days, return an EMPTY posts list and say so in
  `summary` — an empty result is a correct result.

Classify each found post:
- `postType`: "trade_call" (specific actionable position: ticker + direction),
  "pnl_boast" (posting profits/losses, screenshots of P&L), "market_view"
  (opinion without a concrete position), "other".
- `claimedResult`: what the POSTER claims about their own result — "gain",
  "loss", "neutral", or "unknown". Judge the claim, not the truth.
- `tickers`: US-listed tickers mentioned (empty if none).
- `date`: the post's date (ISO, best effort), `url` if you have one.
- `excerpt`: short quote/summary of the post (<= 280 chars).

Extract `calls`: every concrete, dated trade call (ticker + long/short) found
in the posts, including ones inside pnl_boasts ("bought X at ..."). The system
freezes a real entry price at first sighting and tracks the actual return —
so precision matters more than volume; skip vague "watching X" mentions.

`summary` (Simplified Chinese, 3-5 sentences): what this account posted
recently, the mix of wins/losses they show, and any red flags (only-gains
posting, deleted losses, vague entries, engagement bait). Be blunt but fair,
and state clearly how much coverage you actually got.

Return ONLY by calling the emit_kol_scan tool.
"""

KOL_TOOL: dict[str, Any] = {
    "name": "emit_kol_scan",
    "description": "Return the verified posts, extracted calls, and summary.",
    "strict": True,
    "input_schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "summary": {"type": "string"},
            "posts": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "date": {"type": "string"},
                        "url": {"type": "string"},
                        "excerpt": {"type": "string"},
                        "postType": {
                            "type": "string",
                            "enum": ["trade_call", "pnl_boast", "market_view", "other"],
                        },
                        "claimedResult": {
                            "type": "string",
                            "enum": ["gain", "loss", "neutral", "unknown"],
                        },
                        "tickers": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": [
                        "date",
                        "url",
                        "excerpt",
                        "postType",
                        "claimedResult",
                        "tickers",
                    ],
                },
            },
            "calls": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "ticker": {"type": "string"},
                        "direction": {"type": "string", "enum": ["long", "short"]},
                        "date": {"type": "string"},
                        "excerpt": {"type": "string"},
                    },
                    "required": ["ticker", "direction", "date", "excerpt"],
                },
            },
        },
        "required": ["summary", "posts", "calls"],
    },
}

KOL_USER_TEMPLATE = """\
Handle to audit: @{handle} on X. Today is {date}.

Posts already recorded by the system (do NOT re-report these; only NEW posts):
{known_block}

Find and classify this account's recent posts (last ~3 days), extract concrete
trade calls, and summarize the win/loss posting pattern.
"""


def build_kol_message(*, handle: str, date: str, known_excerpts: list[str]) -> str:
    known_block = (
        "\n".join(f"- {e}" for e in known_excerpts[-30:]) if known_excerpts else "- (none yet)"
    )
    return KOL_USER_TEMPLATE.format(handle=handle, date=date, known_block=known_block)
