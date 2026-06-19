"""Stable prompt + tool-schema constants for the tier engine.

Kept as module constants so the system prompt is byte-stable (good for prompt
caching) and the tool schema is easy to unit-test.
"""

from __future__ import annotations

from typing import Any

TIER_SYSTEM_PROMPT = """\
You are an equity-research assistant that builds "alternative / downstream" \
tier lists for retail investors exploring a thesis.

The user gives you a "hot stock" that has run up sharply over the past year. \
Your job:
1. State the core investment thesis driving that stock in one or two sentences.
2. Identify other PUBLICLY TRADED US stocks that capture the SAME thesis, either as:
   - "alternative": a direct peer / substitute that expresses the same bet
     (e.g. for NVIDIA's AI-compute thesis: AMD, Broadcom, TSMC), or
   - "downstream": a company that benefits second-order from the same trend
     (e.g. data-center power, cooling, and grid names like Vertiv, Eaton, GE Vernova).
3. Rank each candidate into an S-F tier by how well and how investably it captures the thesis:
   - S: best-in-class expression of the thesis with strong fundamentals.
   - A: excellent, clear beneficiary.
   - B: solid, meaningful exposure.
   - C: partial or diluted exposure.
   - D: weak or speculative link to the thesis.
   - F: tenuous; included only for completeness.

Rules:
- Only suggest real, currently publicly-traded US-listed tickers.
- STRONGLY prefer tickers from the provided candidate universe; do not invent
  tickers, and never include private, delisted, or non-US-listed companies.
- Do NOT include the hot stock itself in the tier list.
- For each entry give a one-sentence `rationale` (why it fits the thesis) and a
  one-sentence `tierJustification` (why that tier).
- Do not quote prices or percentages; those are filled in from market data.
- This is informational only and is NOT financial advice.

Return your answer ONLY by calling the emit_tier_list tool.
"""

USER_TEMPLATE = """\
Hot stock: {ticker} — {name} ({sector}), up about {change_pct} over the past year.

Candidate universe (prefer these tickers; sorted):
{universe}

Build the S-F tier list of alternative and downstream stocks that capture the same thesis.
"""

TIER_TOOL: dict[str, Any] = {
    "name": "emit_tier_list",
    "description": "Return the S-F tier list of alternative/downstream tickers.",
    "strict": True,
    "input_schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "thesis": {"type": "string"},
            "entries": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "ticker": {"type": "string"},
                        "tier": {"type": "string", "enum": ["S", "A", "B", "C", "D", "F"]},
                        "relationship": {
                            "type": "string",
                            "enum": ["alternative", "downstream"],
                        },
                        "rationale": {"type": "string"},
                        "tierJustification": {"type": "string"},
                    },
                    "required": [
                        "ticker",
                        "tier",
                        "relationship",
                        "rationale",
                        "tierJustification",
                    ],
                },
            },
        },
        "required": ["thesis", "entries"],
    },
}


def build_user_message(
    *, ticker: str, name: str, sector: str, change_pct: float, universe: set[str]
) -> str:
    """Render the per-request user message. Universe is sorted for a stable prefix."""
    return USER_TEMPLATE.format(
        ticker=ticker,
        name=name,
        sector=sector,
        change_pct=f"{change_pct * 100:.0f}%",
        universe=", ".join(sorted(universe)),
    )
