"""Decision event system for SkyEmpire V3.7 (互动 PR/营销).

Pure functions — no FastAPI, no storage, no I/O.

Design
======
Each turn with no pending decision there is a DECISION_CHANCE=0.15 probability
of drawing a new DecisionEvent from the pool.  The PRNG seed follows the same
pattern as M3.1 events but with a "decision" salt:

    seed = f"{gameId}:{turn}:decision"
    rng  = random.Random(seed)

Validation
==========
``validate_decision(raw_dict) -> DecisionEvent | None``:
  - 2–3 options required
  - Exactly one option with isDefault=True
  - cashDelta in [-30M, +10M], brandDelta in [-15, +15]
  - Tri-lingual fields non-empty when present (same as M3.1)
  Returns None on any schema violation.

Draw
====
``draw_decision(game_id, turn, event_pool) -> DecisionEvent | None``:
  - PRNG seeded with f"{gameId}:{turn}:decision"
  - DECISION_CHANCE gate
  - Uniform random choice from entire pool (no weighting)
  - Returns None if pool empty, gate miss, or already has pending decision
    (caller is responsible for checking pending_decision before calling)

Auto-resolve
============
``auto_resolve_decision(state) -> list[NewsItem]``:
  Apply the isDefault option to the game state, clear pending_decision, and
  return a NewsItem reporting 「自动处理」.  Called by settle_turn when the
  current turn equals the decision's expires_turn.
"""
from __future__ import annotations

import random
from typing import Any

from app.engine import balance
from app.engine.state import (
    DecisionEvent,
    DecisionOption,
    GameState,
    NewsItem,
)


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def _optional_nonempty(raw: dict[str, Any], key: str) -> str | None:
    """Return the string value for key if present and non-empty, else None.
    Raises ValueError if explicitly set to an empty string."""
    val = raw.get(key)
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        raise ValueError(f"field {key} must not be empty when present")
    return s


def validate_decision(raw: dict[str, Any]) -> DecisionEvent | None:
    """Parse and validate one raw decision event dict from events-decisions.json.

    Returns None (skip whole entry) on any schema or bounds violation.
    """
    try:
        event_id = str(raw["id"])
        prompt = str(raw["prompt"])
        prompt_en = _optional_nonempty(raw, "promptEn")
        prompt_es = _optional_nonempty(raw, "promptEs")
        detail = raw.get("detail")
        detail_str = str(detail).strip() if detail else None
        detail_en = _optional_nonempty(raw, "detailEn")
        detail_es = _optional_nonempty(raw, "detailEs")

        options_raw = raw.get("options", [])
        if not (2 <= len(options_raw) <= 3):
            return None

        options: list[DecisionOption] = []
        default_count = 0
        for opt_raw in options_raw:
            opt_id = str(opt_raw["id"])
            label = str(opt_raw["label"])
            label_en = _optional_nonempty(opt_raw, "labelEn")
            label_es = _optional_nonempty(opt_raw, "labelEs")
            cash_delta = float(opt_raw["cashDelta"])
            brand_delta = float(opt_raw["brandDelta"])

            # Bounds check
            if not (balance.DECISION_CASH_DELTA_MIN <= cash_delta <= balance.DECISION_CASH_DELTA_MAX):
                return None
            if not (balance.DECISION_BRAND_DELTA_MIN <= brand_delta <= balance.DECISION_BRAND_DELTA_MAX):
                return None

            is_default = bool(opt_raw.get("isDefault", False))
            if is_default:
                default_count += 1

            options.append(
                DecisionOption(
                    id=opt_id,
                    label=label,
                    cash_delta=cash_delta,
                    brand_delta=brand_delta,
                    is_default=is_default,
                    label_en=label_en,
                    label_es=label_es,
                )
            )

        # Exactly one default option required
        if default_count != 1:
            return None

        return DecisionEvent(
            id=event_id,
            prompt=prompt,
            options=options,
            expires_turn=0,  # caller sets this when drawing
            drawn_turn=0,
            prompt_en=prompt_en,
            prompt_es=prompt_es,
            detail=detail_str,
            detail_en=detail_en,
            detail_es=detail_es,
        )
    except (KeyError, TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Draw
# ---------------------------------------------------------------------------


def draw_decision(
    game_id: str,
    turn: int,
    decision_pool: list[DecisionEvent] | None = None,
) -> DecisionEvent | None:
    """Deterministic draw for one turn (CONTRACT §3 V3.7).

    Args:
        game_id: used in PRNG seed
        turn: current turn number
        decision_pool: the pool to draw from.  None / empty → no draw.

    Returns a *copy* of the chosen DecisionEvent with drawn_turn and
    expires_turn set (expires_turn = turn + 1), or None.
    """
    pool = decision_pool or []
    if not pool:
        return None

    rng = random.Random(f"{game_id}:{turn}:decision")
    if rng.random() >= balance.DECISION_CHANCE:
        return None

    chosen = rng.choice(pool)
    # Return a shallow copy with timing fields set
    import dataclasses
    result = dataclasses.replace(
        chosen,
        drawn_turn=turn,
        expires_turn=turn + 1,
    )
    return result


# ---------------------------------------------------------------------------
# Resolve
# ---------------------------------------------------------------------------


def resolve_decision(state: GameState, option_id: str) -> None:
    """Apply the chosen option and clear pending_decision (CONTRACT §3 V3.7).

    Raises ValueError if there is no pending decision or option_id is invalid.
    cash delta is applied immediately; brand delta is clamped to [0, 100].
    """
    if state.pending_decision is None:
        raise ValueError("no pending decision to resolve")

    option = next(
        (o for o in state.pending_decision.options if o.id == option_id),
        None,
    )
    if option is None:
        raise ValueError(
            f"unknown optionId {option_id!r}; "
            f"valid: {[o.id for o in state.pending_decision.options]}"
        )

    state.cash = round(state.cash + option.cash_delta, 2)
    state.brand = max(
        balance.BRAND_MIN,
        min(balance.BRAND_MAX, state.brand + option.brand_delta),
    )
    state.pending_decision = None


def auto_resolve_decision(state: GameState) -> list[NewsItem]:
    """Auto-resolve pending decision with the default option at turn expiry.

    Returns a NewsItem list (one item) for the turn news.  Clears pending.
    """
    if state.pending_decision is None:
        return []

    decision = state.pending_decision
    default_option = next(
        (o for o in decision.options if o.is_default),
        decision.options[0],  # fallback: should never happen if validated
    )

    state.cash = round(state.cash + default_option.cash_delta, 2)
    state.brand = max(
        balance.BRAND_MIN,
        min(balance.BRAND_MAX, state.brand + default_option.brand_delta),
    )
    state.pending_decision = None

    return [
        NewsItem(
            headline=f"自动处理：{decision.prompt[:30]}…",
            detail=(
                f"抉择事件超时，已自动采用「{default_option.label}」。"
                f"现金变动 ${default_option.cash_delta:+,.0f}，"
                f"品牌变动 {default_option.brand_delta:+.0f}。"
            ),
            kind="event",
        )
    ]
