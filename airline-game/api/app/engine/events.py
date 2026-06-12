"""Dynamic event system for SkyEmpire M3.1.

Pure functions — no FastAPI, no storage, no I/O.

Design note — injectable event pool
=====================================
Every public function that needs the event library accepts an explicit
``event_pool`` parameter (list[GameEvent]).  Passing ``None`` or ``[]`` means
"no events" — no global mutable state is involved.  The production path is:
  app.data.load_events() → list[GameEvent] → GameService._event_pool
  → settle_turn(state, world, event_pool=…)
Old tests that call settle_turn without event_pool get None → empty pool →
no events drawn, keeping their numbers exact.  New tests pass small synthetic
pools for deterministic coverage.

Validation
===========
``validate_event(raw_dict) -> GameEvent | None``:  returns a parsed GameEvent
or None if the entry fails any schema / bounds check.  Invalid entries are
silently skipped — the CONTRACT says "invalid entries … skipped whole".

Draw
=====
``draw_event(state, turn, event_pool) -> GameEvent | None``:
  • Seeded PRNG:  random.Random(f"{gameId}:{turn}")
  • EVENT_CHANCE = 0.45 probability gate
  • Weighted draw (minor weight 3 / major weight 1) from candidates whose ids
    are NOT already active
  • Returns None if pool is empty, gate miss, or no eligible candidates remain

Effect resolution
==================
``compute_effect_mults(active_events) -> dict[str, float]``:
  Returns {target: clamped_product} for each affected target key.  Targets not
  mentioned in any active event are absent from the dict (multiply by 1.0).
  Same-target products are clamped to [EVENT_STACK_CLAMP_LO, EVENT_STACK_CLAMP_HI].

``is_in_scope(event, city_a, city_b) -> bool``:
  True when the event's scope covers the (city_a, city_b) route pair.
  global  → always True
  city    → at least one of city_a / city_b is in event.scope.ids
  route   → event.scope.ids contains exactly those two city ids (order-insensitive)

``get_demand_mult(active_events, city_a, city_b) -> float``:
  Product of all demand-target mults that are in scope for (city_a, city_b),
  clamped to [EVENT_STACK_CLAMP_LO, EVENT_STACK_CLAMP_HI].

``get_cost_mult(active_events, target) -> float``:
  Product of all mults for a non-demand cost target (fuelCost / slotFee /
  serviceCost); scope is irrelevant for cost targets (player-only, global in
  practice).  Clamped to [EVENT_STACK_CLAMP_LO, EVENT_STACK_CLAMP_HI].

Settlement integration
=======================
``process_events(state, turn, event_pool) -> list[NewsItem]``:
  Call at the START of each end-turn settlement:
    1. Decrement remainingTurns for all active events; remove those that reach 0.
    2. Attempt to draw one new event; if drawn, add to state.active_events and
       return a NewsItem{kind:"event"} announcing it.
  Returns the list of new NewsItems generated (may be empty).
"""
from __future__ import annotations

import random
from typing import Any

from app.engine import balance
from app.engine.state import (
    ActiveEvent,
    EventEffect,
    EventScope,
    GameEvent,
    GameState,
    NewsItem,
)

# There is no module-level mutable default pool.  The pool is always passed
# explicitly: either from GameService (loaded at startup) or from test code.
# settle_turn(state, world, event_pool=None) treats None as "no pool / no events",
# matching the behaviour of old tests that do not supply a pool.


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

_VALID_TARGETS = {"fuelCost", "demand", "slotFee", "serviceCost"}
_VALID_SCOPE_KINDS = {"global", "city", "route"}
_VALID_SOURCES = {"static", "news"}
_VALID_SEVERITIES = {"minor", "major"}


def validate_event(raw: dict[str, Any]) -> GameEvent | None:
    """Parse and validate one raw event dict.  Returns None (skip whole entry)
    on any schema error or out-of-bounds mult/duration."""
    try:
        event_id = str(raw["id"])
        source = str(raw["source"])
        if source not in _VALID_SOURCES:
            return None
        headline = str(raw["headline"])
        detail = raw.get("detail")
        source_url = raw.get("sourceUrl")
        severity = str(raw["severity"])
        if severity not in _VALID_SEVERITIES:
            return None

        duration = int(raw["durationTurns"])
        if not (balance.EVENT_DURATION_MIN <= duration <= balance.EVENT_DURATION_MAX):
            return None

        # Parse scope
        scope_raw = raw["scope"]
        scope_kind = str(scope_raw["kind"])
        if scope_kind not in _VALID_SCOPE_KINDS:
            return None
        scope_ids: list[str] = list(scope_raw.get("ids") or [])
        scope = EventScope(kind=scope_kind, ids=scope_ids)

        # Parse effects (1–3 entries; any invalid entry invalidates the whole event)
        effects_raw = raw["effects"]
        if not (1 <= len(effects_raw) <= 3):
            return None
        effects: list[EventEffect] = []
        for eff_raw in effects_raw:
            target = str(eff_raw["target"])
            if target not in _VALID_TARGETS:
                return None
            mult = float(eff_raw["mult"])
            if not (balance.EVENT_EFFECT_MULT_MIN <= mult <= balance.EVENT_EFFECT_MULT_MAX):
                return None
            effects.append(EventEffect(target=target, mult=mult))

        return GameEvent(
            id=event_id,
            source=source,
            headline=headline,
            scope=scope,
            effects=effects,
            duration_turns=duration,
            severity=severity,
            detail=detail if detail is None else str(detail),
            source_url=source_url if source_url is None else str(source_url),
        )
    except (KeyError, TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Draw
# ---------------------------------------------------------------------------


def draw_event(
    game_id: str,
    turn: int,
    active_event_ids: set[str],
    event_pool: list[GameEvent] | None = None,
) -> GameEvent | None:
    """Deterministic draw for one turn.

    Args:
        game_id: the game's id string (used in PRNG seed).
        turn: current turn number (1-based).
        active_event_ids: set of event ids that are already active (no re-draw).
        event_pool: the pool to draw from.  None / empty list → no events drawn.

    Returns:
        A GameEvent or None (gate miss / no eligible candidates / empty pool).
    """
    pool = event_pool or []
    rng = random.Random(f"{game_id}:{turn}")

    # Gate check — EVENT_CHANCE = 0.45
    if rng.random() >= balance.EVENT_CHANCE:
        return None

    # Build candidate list (no duplicates of already-active ids)
    candidates = [ev for ev in pool if ev.id not in active_event_ids]
    if not candidates:
        return None

    # Weighted draw by severity
    weights = [balance.EVENT_SEVERITY_WEIGHTS[ev.severity] for ev in candidates]
    return rng.choices(candidates, weights=weights, k=1)[0]


# ---------------------------------------------------------------------------
# Scope helpers
# ---------------------------------------------------------------------------


def is_in_scope(event: GameEvent | ActiveEvent, city_a: str, city_b: str) -> bool:
    """True when the event's scope covers the city pair (city_a, city_b)."""
    kind = event.scope.kind
    if kind == "global":
        return True
    ids = set(event.scope.ids)
    if kind == "city":
        return bool(ids & {city_a, city_b})
    if kind == "route":
        return ids == {city_a, city_b}
    return False


# ---------------------------------------------------------------------------
# Effect resolution helpers
# ---------------------------------------------------------------------------


def _clamp(value: float) -> float:
    return max(balance.EVENT_STACK_CLAMP_LO, min(balance.EVENT_STACK_CLAMP_HI, value))


def get_demand_mult(
    active_events: list[ActiveEvent], city_a: str, city_b: str
) -> float:
    """Stacked product of all in-scope demand mults, clamped to [0.25, 4.0]."""
    product = 1.0
    for ev in active_events:
        if not is_in_scope(ev, city_a, city_b):
            continue
        for eff in ev.effects:
            if eff.target == "demand":
                product *= eff.mult
    return _clamp(product)


def get_cost_mult(active_events: list[ActiveEvent], target: str) -> float:
    """Stacked product for a cost target (fuelCost / slotFee / serviceCost).
    Scope is not applied for cost targets — they affect the player globally
    (CONTRACT §3: 'cost targets player only').  Clamped to [0.25, 4.0]."""
    product = 1.0
    for ev in active_events:
        for eff in ev.effects:
            if eff.target == target:
                product *= eff.mult
    return _clamp(product)


# ---------------------------------------------------------------------------
# Settlement integration
# ---------------------------------------------------------------------------


def process_events(
    state: GameState,
    turn: int,
    event_pool: list[GameEvent] | None = None,
) -> list[NewsItem]:
    """Process events at the START of settlement (CONTRACT §3 M3.1 order):
      1. Decrement remainingTurns; remove expired events.
      2. Draw one new event (deterministic, seeded).
    Returns new NewsItems to append to the turn's news list.
    """
    # Step 1: decrement and expire
    still_active: list[ActiveEvent] = []
    for ev in state.active_events:
        ev.remaining_turns -= 1
        if ev.remaining_turns > 0:
            still_active.append(ev)
    state.active_events = still_active

    # Step 2: draw
    active_ids = {ev.id for ev in state.active_events}
    drawn = draw_event(state.id, turn, active_ids, event_pool)

    if drawn is None:
        return []

    # Activate
    activated = ActiveEvent(
        id=drawn.id,
        source=drawn.source,
        headline=drawn.headline,
        scope=drawn.scope,
        effects=drawn.effects,
        duration_turns=drawn.duration_turns,
        severity=drawn.severity,
        detail=drawn.detail,
        source_url=drawn.source_url,
        started_turn=turn,
        remaining_turns=drawn.duration_turns,
    )
    state.active_events.append(activated)

    news = NewsItem(
        headline=drawn.headline,
        detail=drawn.detail,
        kind="event",
    )
    return [news]
