"""Stable prompt + tool-schema constants for the tier engine.

Kept as module constants so the system prompt is byte-stable (good for prompt
caching) and the tool schema is easy to unit-test.
"""

from __future__ import annotations

from typing import Any

TIER_SYSTEM_PROMPT = """\
You are an equity-research assistant that builds "same-thesis" stock lists for \
retail investors exploring why a stock ran up.

The user gives you a "hot stock" that rose sharply over the past year. Your job:
1. State the core investment thesis driving that stock in one or two sentences.
2. List other REAL, currently US-listed publicly-traded stocks that capture the \
SAME thesis, each labelled as exactly one of:
   - "alternative": a genuine peer/substitute with the SAME business model or the
     same direct exposure to the thesis. Example — for Palantir's applied-AI
     enterprise-software thesis: Snowflake, C3.ai, Salesforce, ServiceNow. NOT
     "another big tech company" and NOT "same GICS sector".
   - "downstream": a company tied to the hot stock by a CONCRETE, NAMEABLE link in
     its value chain — a supplier, a customer, a channel / systems-integrator
     partner, or the infrastructure its product is built on or sold into. Example
     — for Palantir: Booz Allen (BAH) and Accenture (ACN), which implement and
     resell Palantir software to clients; or the cloud it runs on.

3. Rank each into an S-F tier by how strong and investable that thesis-exposure is:
   S best-in-class · A excellent · B solid · C partial · D weak · F tenuous.

CRITICAL rules on relationships:
- For EVERY entry, `rationale` MUST state the SPECIFIC connection and where it
  comes from — name the mechanism (who builds/sells/buys/integrates/depends-on
  what). One concrete, verifiable sentence. A reader must understand the exact
  link. Example: "Booz Allen deploys and resells Palantir Foundry to U.S.
  federal agencies, so its revenue tracks Palantir adoption."
- DO NOT include any company whose only connection is "both benefit from AI",
  "both are big tech", or "same sector". A shared macro theme is NOT a
  relationship. If you cannot name a concrete peer or value-chain link, LEAVE IT
  OUT. Prefer a short, defensible list over a long, padded one.
- `tierJustification` is one sentence on why that tier.

Other rules:
- Only real, currently US-listed publicly-traded tickers. Every ticker is
  verified against live market data afterward and silently dropped if it can't be
  priced, so never invent tickers or use private/delisted/non-US names.
- Do NOT include the hot stock itself.
- Do not quote prices or percentages; those are filled in from market data.
- Informational only — NOT financial advice.

Return your answer ONLY by calling the emit_tier_list tool.
"""

USER_TEMPLATE = """\
Hot stock: {ticker} — {name} ({sector}), up about {change_pct} over the past year.

Build the S-F tier list of alternative and downstream stocks that capture the same
thesis. Every entry must have a concrete, nameable connection (a peer with the same
exposure, or a real value-chain link); exclude anything whose only tie is a shared
macro theme.
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


def build_user_message(*, ticker: str, name: str, sector: str, change_pct: float) -> str:
    """Render the per-request user message."""
    return USER_TEMPLATE.format(
        ticker=ticker,
        name=name,
        sector=sector,
        change_pct=f"{change_pct * 100:.0f}%",
    )
