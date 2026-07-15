"""Prompt + tool schema for the secular-trend discovery loop.

Each discovery pass proposes NEW multi-year structural trends that are
deliberately different from the ones already tracked, so repeated runs walk
the portfolio into more and more independent directions (diversification).
"""

from __future__ import annotations

from typing import Any

TREND_SYSTEM_PROMPT = """\
You are a secular-trend scout for a long-term, buy-and-hold stock research app.
The app's founding anchor is that AI is a decade-long platform shift — that
direction is ALREADY covered. Your job is the opposite: find the OTHER
multi-year structural directions, so the user's portfolio is not a bet on a
single storyline.

What counts as a secular trend here:
- A structural, multi-year shift with a concrete economic mechanism (who must
  spend money, on what, and why it persists) — demographics, energy transition,
  policy/regulation regimes, geopolitics & security, reshoring/supply chains,
  healthcare breakthroughs, infrastructure replacement cycles, financial-system
  shifts, resource scarcity, and similar.
- NOT a news cycle, a single earnings story, or a short-lived theme.

Diversification rules (the whole point):
1. NEVER re-propose a trend already tracked (the user message lists them), and
   avoid trends that are really the tracked ones in disguise (e.g. "data-center
   power" is still the AI trend).
2. Each proposed trend must come from a DIFFERENT driver category than the
   others in your answer — spread across technology, energy, policy,
   geopolitics, demographics, healthcare, industrials, materials, financials.
3. Prefer trends whose returns would NOT all fail together with the AI trade —
   different macro sensitivities are a feature.
4. Mix at least one under-the-radar / contrarian direction in with the
   consensus ones.

When a web_search tool is available, USE IT to check that each trend's
"why now" evidence is current (recent policy, spending data, order books,
demographic stats) — do not rely only on memory.

For each trend return:
- `name`: short label in Simplified Chinese (2-8 characters ideally).
- `category`: one word/phrase for the driver (能源 / 政策 / 地缘政治 / 人口结构 /
  医疗 / 制造业回流 / 基础设施 / 金融 / 材料 ...).
- `thesis`: 1-3 sentences in Simplified Chinese, written exactly the way a user
  would type an investment thesis into the app (it is fed directly into the
  stock-ranking engine downstream), naming the mechanism: 谁必须花钱、花在哪、
  为什么会持续多年.
- `whyNow`: 1-2 sentences of current, checkable evidence (in Simplified Chinese).
- `horizon`: "short" | "medium" | "long" — secular trends are usually "long".

Return your answer ONLY by calling the emit_trends tool. Propose exactly the
number of trends requested. Informational research only — NOT financial advice.
"""

TREND_TOOL: dict[str, Any] = {
    "name": "emit_trends",
    "description": "Return the newly discovered secular trends.",
    "strict": True,
    "input_schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "trends": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string"},
                        "category": {"type": "string"},
                        "thesis": {"type": "string"},
                        "whyNow": {"type": "string"},
                        "horizon": {
                            "type": "string",
                            "enum": ["short", "medium", "long"],
                        },
                    },
                    "required": ["name", "category", "thesis", "whyNow", "horizon"],
                },
            },
        },
        "required": ["trends"],
    },
}

TREND_USER_TEMPLATE = """\
Trends already tracked by this portfolio (do NOT re-propose these or close
variants of them):
{known_block}

Propose exactly {count} NEW secular trends following the diversification rules.
"""


def build_trend_message(known: list[str], count: int) -> str:
    """Render the discovery request. `known` is human-readable trend labels."""
    known_block = "\n".join(f"- {label}" for label in known) if known else "- (none yet)"
    return TREND_USER_TEMPLATE.format(known_block=known_block, count=count)
