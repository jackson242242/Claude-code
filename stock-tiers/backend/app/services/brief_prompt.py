"""Prompt + tool schema for the daily audio brief.

One pass per day: web-search what changed in equities, macro/finance, and
geopolitics, what notable industry voices said on investing/tech podcasts,
distill swing-trade theses, and write a spoken-word script for TTS.
"""

from __future__ import annotations

from typing import Any

BRIEF_SYSTEM_PROMPT = """\
You are the daily briefing editor for a long-term investor who listens to the
brief as AUDIO while driving. You produce one structured brief per day, in
Simplified Chinese, grounded in what actually happened in roughly the last 24
hours.

Coverage — USE the web_search tool for each bucket; do not rely on memory for
anything time-sensitive:
1. 股市: the day's biggest US-market moves and WHY (earnings, guidance, orders,
   analyst actions). Name tickers.
2. 金融宏观: rates, inflation prints, Fed/central-bank signals, credit, dollar,
   commodities — only what changed and what it implies.
3. 地缘政治: conflicts, elections, sanctions, tariffs, export controls, energy
   politics — and the concrete market linkage of each.
4. 播客观点: what notable industry leaders and investors said in the last day
   or two on major investing/tech podcasts and interviews (e.g. All-In, BG2,
   Odd Lots, Invest Like the Best, Dwarkesh, Bloomberg/CNBC interviews).
   Search for episode recaps, transcripts, and coverage. Attribute every quote
   or view to the person AND the show. If the user message lists fresh episode
   metadata, use it to target these searches. Never invent a quote — if you
   can't verify who said it where, leave it out.

From all of that, distill 1-3 swing-trade (波段) thesis candidates: a specific,
mechanism-based idea an investor could research further (谁必须花钱、花在哪、
催化剂是什么). Each thesis is written the way a user would type it into the
app's thesis box, since it feeds the stock-ranking engine directly. Mark the
horizon honestly (usually "short" or "medium").

The `script` field is the AUDIO narration (3-5 minutes, ~900-1400 汉字):
- Spoken, natural Simplified Chinese. No markdown, no URLs, no bullet symbols,
  no English sentences (tickers like NVDA are fine, read as letters).
- Structure: 开场一句(今天是几月几号,一句话总览) -> 股市 -> 金融宏观 ->
  地缘政治 -> 播客里值得听的观点 -> 波段思路 -> 一句免责声明结尾
  (说明内容仅供研究参考,不构成投资建议).
- Numbers spoken naturally (说"涨了百分之三",不写"3%").
- NEVER promise returns, never give price targets, present theses as research
  ideas to verify, not calls to action.

Also fill the structured fields: `highlights` (one entry per noteworthy item,
tagged with its topic), and `swingTheses`. `title` is a short daily headline
like "7月7日:关税落地与算力财报周".

Return ONLY by calling the emit_brief tool.
"""

BRIEF_TOOL: dict[str, Any] = {
    "name": "emit_brief",
    "description": "Return the structured daily brief + spoken script.",
    "strict": True,
    "input_schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "title": {"type": "string"},
            "script": {"type": "string"},
            "highlights": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "topic": {
                            "type": "string",
                            "enum": ["股市", "金融宏观", "地缘政治", "播客观点"],
                        },
                        "headline": {"type": "string"},
                        "detail": {"type": "string"},
                    },
                    "required": ["topic", "headline", "detail"],
                },
            },
            "swingTheses": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string"},
                        "thesis": {"type": "string"},
                        "horizon": {
                            "type": "string",
                            "enum": ["short", "medium", "long"],
                        },
                        "whyNow": {"type": "string"},
                    },
                    "required": ["name", "thesis", "horizon", "whyNow"],
                },
            },
        },
        "required": ["title", "script", "highlights", "swingTheses"],
    },
}

BRIEF_USER_TEMPLATE = """\
Today is {date}. Produce today's brief.

Listener context (personalize relevance, don't limit coverage to it):
- Portfolio holdings: {holdings}
- Secular trends tracked: {trends}

{podcast_block}
"""

PODCAST_BLOCK_TEMPLATE = """\
Fresh podcast episodes detected in the listener's feed scan (metadata only —
verify content via web search before quoting):
{episodes}
"""


def build_brief_message(
    *,
    date: str,
    holdings: list[str],
    trends: list[str],
    podcast_episodes: list[str],
) -> str:
    podcast_block = (
        PODCAST_BLOCK_TEMPLATE.format(
            episodes="\n".join(f"- {e}" for e in podcast_episodes)
        )
        if podcast_episodes
        else "(No podcast feed scan available today — search the major shows directly.)"
    )
    return BRIEF_USER_TEMPLATE.format(
        date=date,
        holdings=", ".join(holdings) if holdings else "(none yet)",
        trends=", ".join(trends) if trends else "(none yet)",
        podcast_block=podcast_block,
    )
