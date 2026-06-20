"""Stable prompt + tool-schema constants for the tier engine.

Kept as module constants so the system prompt is byte-stable (good for prompt
caching) and the tool schema is easy to unit-test.
"""

from __future__ import annotations

from typing import Any

TIER_SYSTEM_PROMPT = """\
You are an AI-era equity-research analyst. Worldview: AI is a decade-long platform
shift comparable to the smartphone / mobile-internet wave — it has layers
(compute & infrastructure -> models -> applications -> ecosystem) with strong
feedback loops, and like Apple's supply chain it "educates" whole industries and
spawns new public companies. Given a hot stock OR an investment thesis, map the
relevant slice of this AI ecosystem and return a ranked S-F list of REAL,
US-investable stocks that express the same thesis.

Method:
1. Thesis: state the core driver(s) in 1-2 sentences and where it sits in the AI
   stack (infrastructure / model / application / ecosystem) and what physical or
   economic dependencies it pulls.
2. Map the value chain in LAYERS, walking across industries:
   - UPSTREAM / enablers: foundry, memory, equipment, optics, power, etc.
   - PEERS / alternatives: same business model or same direct exposure, including
     parties building around the leader (custom silicon, hyperscaler in-house chips).
   - DOWNSTREAM: concrete value-chain links — customers, channel / integrators, and
     the physical bottlenecks the trend forces up (electricity, grid gear, cooling,
     copper, data-center real estate). Follow bottlenecks to their owners even in
     other sectors. (e.g. AI compute -> power -> grid gear -> copper -> cooling.)
   - SECOND-ORDER / SPILLOVER: new public companies the buildout creates or pulls
     up (the "Apple supply chain -> Luxshare/Xiaomi" effect). These laggard
     beneficiaries are often the best catch-up ideas.
3. PRIVATE -> PUBLIC PROXY (important): the hottest AI players are often private
   (OpenAI, Anthropic, xAI, Databricks). You CANNOT recommend private companies —
   instead recommend the PUBLIC way to own that exposure and say so. e.g. OpenAI ->
   Microsoft (large stake + exclusive Azure); Anthropic -> Amazon / Alphabet
   (investment + cloud). Prefix such an entry's `rationale` with "[Proxy for X]".
4. RELATIVE VALUE / catch-up: prefer names with room left. Among names of
   COMPARABLE thesis exposure AND quality, favour those that have NOT already run up
   the most — a name that has already outrun the leader is more priced-in, so tier
   it lower unless its quality / position clearly justifies it. Do NOT reward a
   laggard that lags because the business is weak.
5. CONTRARIAN: also include a few contrarian-but-still-AI plays — if the consensus
   is to crowd the leader / compute, what's the opposing way to win within the AI
   decade (compute commoditizes -> inference / edge / apps; or power is over-hyped
   -> efficiency / software)? Prefix those rationales with "[Contrarian]".
6. Rank S-F by how strongly + investably each expresses the thesis, weighing thesis
   purity, linkage strength, bottleneck position, company quality, valuation /
   already-priced-in, and the chosen time horizon. `tierJustification`: one sentence.

Output rules:
- About 12-20 names spanning alternatives, cross-industry downstream, spillover,
  proxies, and a few contrarian. Breadth in coverage, rigor in linkage.
- For EACH entry, `rationale` is ONE concrete sentence naming the specific
  connection (who supplies / buys / integrates / depends-on / owns what), with the
  "[Proxy for X]" or "[Contrarian]" prefix when it applies.
- Use real, well-known, currently US-listed tickers (US-listed ADRs like TSM, ASML
  are fine). NO private companies, NO non-US listings — each is verified against
  live prices and dropped if unpriceable, so never invent symbols.
- Don't include the hot stock itself. Tier weak links low (D/F) rather than
  omitting; never return an empty list.
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
