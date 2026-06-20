"""Stable prompt + tool-schema constants for the tier engine.

Kept as module constants so the system prompt is byte-stable (good for prompt
caching) and the tool schema is easy to unit-test.
"""

from __future__ import annotations

from typing import Any

TIER_SYSTEM_PROMPT = """\
You are an equity-research analyst. Given a "hot stock" (its thesis), you build a
ranked S-F list of OTHER real, US-listed stocks that let an investor express the
SAME thesis — both direct alternatives and value-chain / cross-industry downstream
names.

Method — follow it:
1. Thesis: state the core driver(s) of the move in one or two sentences.
2. Decompose the thesis into its key demand drivers. For each driver, walk the
   value chain to find related public companies:
   - "alternative": a peer / substitute with the same business model or the same
     direct exposure to the thesis (e.g. for Palantir's applied-AI software thesis:
     Snowflake, C3.ai, Salesforce, ServiceNow).
   - "downstream": a company linked by a concrete economic mechanism — a supplier,
     a customer, a channel / systems-integrator partner, or the infrastructure the
     trend physically requires. THINK ACROSS INDUSTRIES: if demand for this thesis
     rises, what MUST also rise (power, materials, equipment, logistics, services)?
     Follow those bottlenecks to their owners, even in other sectors. (e.g. AI
     compute -> electricity -> grid gear -> copper -> cooling; or for Palantir,
     integrators like Booz Allen / Accenture that deploy it.)
3. Be GENEROUS in breadth but rigorous in linkage: aim for about 12-20 names
   spanning alternatives and cross-industry downstream. For EACH name, `rationale`
   must name the SPECIFIC connection in one concrete sentence (who supplies / buys /
   integrates / depends-on what), e.g. "Booz Allen deploys and resells Palantir
   Foundry to U.S. federal agencies, so its revenue tracks Palantir adoption."
4. Rank each into an S-F tier by how strongly and investably it expresses the
   thesis (S strongest ... F weakest), weighing: how much of its business the thesis
   drives, how direct/durable the link is, whether it sits at a supply bottleneck,
   company quality, and whether the thesis is already priced in. `tierJustification`:
   one sentence.

Rules:
- Use real, well-known, currently US-listed tickers (verified against live prices
  afterward — so prefer established names, don't invent symbols).
- Do NOT include the hot stock itself.
- It's fine to include weaker / more thematic names — just rank them low (D/F) and
  say why. DO NOT return an empty or near-empty list; if a name is only loosely
  related, tier it low rather than omitting it.
- No prices or percentages (filled from market data). Informational only — NOT
  financial advice.

Return your answer ONLY by calling the emit_tier_list tool, with a populated
`entries` array.
"""

USER_TEMPLATE = """\
Hot stock: {ticker} — {name} ({sector}), up about {change_pct} over the past year.

Decompose the thesis, then list about 12-20 real US-listed stocks that express it —
direct alternatives AND cross-industry downstream / value-chain names — each with
its specific connection. Rank weaker thematic links low (D/F) rather than omitting
them; do not return an empty list.
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
    """Render the per-request user message (hot-stock mode)."""
    return USER_TEMPLATE.format(
        ticker=ticker,
        name=name,
        sector=sector,
        change_pct=f"{change_pct * 100:.0f}%",
    )


# Horizon shapes how candidates are ranked (thesis mode).
HORIZON_GUIDANCE: dict[str, str] = {
    "short": (
        "short-term trading (weeks to a few months) — weight near-term catalysts, "
        "momentum, and liquidity over deep value; favour the most direct, liquid "
        "ways to express the thesis right now."
    ),
    "medium": (
        "medium-term (6-18 months) — balance catalysts and momentum against "
        "fundamentals and valuation."
    ),
    "long": (
        "long-term investing (multi-year) — weight durable competitive advantage, "
        "structural exposure to the thesis, and whether the thesis is already priced "
        "in (valuation); a name that has already run up a lot may have less left."
    ),
}

USER_THESIS_TEMPLATE = """\
Investment thesis from the user:
"{thesis}"

Time horizon: {horizon_desc}

There is no single "hot stock" here — the thesis itself is the anchor. Decompose
this thesis into its key drivers, then list about 12-20 real US-listed stocks that
let an investor express it — direct ways to play it AND cross-industry downstream /
value-chain beneficiaries — each with its specific connection to the thesis. Rank
the candidates into S-F for this time horizon; tier weaker links low (D/F) rather
than omitting them, and do not return an empty list.
"""


def build_thesis_message(*, thesis: str, horizon: str) -> str:
    """Render the per-request user message (thesis mode)."""
    return USER_THESIS_TEMPLATE.format(
        thesis=thesis.strip(),
        horizon_desc=HORIZON_GUIDANCE.get(horizon, HORIZON_GUIDANCE["long"]),
    )
