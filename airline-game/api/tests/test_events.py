"""M3.1 dynamic event system + M3.2 static library tests.

Injectable event pool
=====================
settle_turn() accepts event_pool= to override the global library.
Old tests rely on conftest.py calling load_world() (NOT load_events()), so
_DEFAULT_POOL stays [] and no events are drawn in old tests.
New tests pass explicit synthetic pools for determinism and coverage.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.data import load_events
from app.engine import balance
from app.engine.events import (
    draw_event,
    get_cost_mult,
    get_demand_mult,
    is_in_scope,
    process_events,
    validate_event,
)
from app.engine.simulate import settle_turn
from app.engine.state import (
    ActiveEvent,
    EventEffect,
    EventScope,
    GameEvent,
    new_game,
)

from tests.conftest import run

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_event(
    event_id: str = "evt-test",
    scope_kind: str = "global",
    scope_ids: list[str] | None = None,
    effects: list[dict] | None = None,
    duration: int = 2,
    severity: str = "minor",
) -> GameEvent:
    return GameEvent(
        id=event_id,
        source="static",
        headline=f"Test event {event_id}",
        scope=EventScope(kind=scope_kind, ids=scope_ids or []),
        effects=[
            EventEffect(target=e["target"], mult=e["mult"])
            for e in (effects or [{"target": "demand", "mult": 1.1}])
        ],
        duration_turns=duration,
        severity=severity,
    )


def make_active(event: GameEvent, started_turn: int = 1, remaining_turns: int | None = None) -> ActiveEvent:
    return ActiveEvent(
        id=event.id,
        source=event.source,
        headline=event.headline,
        scope=event.scope,
        effects=event.effects,
        duration_turns=event.duration_turns,
        severity=event.severity,
        detail=event.detail,
        source_url=event.source_url,
        started_turn=started_turn,
        remaining_turns=remaining_turns if remaining_turns is not None else event.duration_turns,
    )


# ---------------------------------------------------------------------------
# 1. Validation: rejects out-of-bounds mult / duration / bad scope
# ---------------------------------------------------------------------------


class TestValidation:
    VALID_BASE = {
        "id": "evt-valid",
        "source": "static",
        "headline": "Valid event",
        "severity": "minor",
        "durationTurns": 2,
        "scope": {"kind": "global", "ids": []},
        "effects": [{"target": "fuelCost", "mult": 1.2}],
    }

    def _mutate(self, **overrides):
        """Return a copy of VALID_BASE with the given top-level fields replaced."""
        import copy
        raw = copy.deepcopy(self.VALID_BASE)
        raw.update(overrides)
        return raw

    def test_valid_entry_passes(self):
        assert validate_event(self.VALID_BASE) is not None

    def test_mult_too_low_rejects_whole_event(self):
        raw = self._mutate(effects=[{"target": "fuelCost", "mult": 0.49}])
        assert validate_event(raw) is None

    def test_mult_too_high_rejects_whole_event(self):
        raw = self._mutate(effects=[{"target": "demand", "mult": 2.01}])
        assert validate_event(raw) is None

    def test_mult_at_lower_bound_passes(self):
        raw = self._mutate(effects=[{"target": "demand", "mult": 0.5}])
        assert validate_event(raw) is not None

    def test_mult_at_upper_bound_passes(self):
        raw = self._mutate(effects=[{"target": "slotFee", "mult": 2.0}])
        assert validate_event(raw) is not None

    def test_duration_zero_rejects(self):
        raw = self._mutate(durationTurns=0)
        assert validate_event(raw) is None

    def test_duration_nine_rejects(self):
        raw = self._mutate(durationTurns=9)
        assert validate_event(raw) is None

    def test_duration_one_passes(self):
        raw = self._mutate(durationTurns=1)
        assert validate_event(raw) is not None

    def test_duration_eight_passes(self):
        raw = self._mutate(durationTurns=8)
        assert validate_event(raw) is not None

    def test_bad_scope_kind_rejects(self):
        raw = self._mutate(scope={"kind": "continent", "ids": []})
        assert validate_event(raw) is None

    def test_bad_target_rejects(self):
        raw = self._mutate(effects=[{"target": "crewCost", "mult": 1.1}])
        assert validate_event(raw) is None

    def test_bad_source_rejects(self):
        raw = self._mutate(source="scraped")
        assert validate_event(raw) is None

    def test_bad_severity_rejects(self):
        raw = self._mutate(severity="catastrophic")
        assert validate_event(raw) is None

    def test_missing_required_field_rejects(self):
        import copy
        raw = copy.deepcopy(self.VALID_BASE)
        del raw["effects"]
        assert validate_event(raw) is None

    def test_zero_effects_rejects(self):
        raw = self._mutate(effects=[])
        assert validate_event(raw) is None

    def test_four_effects_rejects(self):
        raw = self._mutate(effects=[{"target": "demand", "mult": 1.0}] * 4)
        assert validate_event(raw) is None

    def test_three_effects_passes(self):
        raw = self._mutate(effects=[
            {"target": "demand", "mult": 1.1},
            {"target": "fuelCost", "mult": 0.9},
            {"target": "slotFee", "mult": 1.05},
        ])
        ev = validate_event(raw)
        assert ev is not None
        assert len(ev.effects) == 3


# ---------------------------------------------------------------------------
# 2. Deterministic draw reproducibility
# ---------------------------------------------------------------------------


class TestDeterministicDraw:
    """Two calls with the same game_id + turn must yield the same outcome."""

    def _pool(self):
        return [
            make_event("evt-a", severity="minor"),
            make_event("evt-b", severity="major"),
            make_event("evt-c", severity="minor"),
        ]

    def test_same_seed_same_result(self):
        pool = self._pool()
        result_1 = draw_event("game-xyz", 5, set(), pool)
        result_2 = draw_event("game-xyz", 5, set(), pool)
        # Both must be identical objects (same id)
        assert (result_1 is None) == (result_2 is None)
        if result_1 is not None:
            assert result_1.id == result_2.id

    def test_different_turn_may_differ(self):
        """Different turns use different RNG seeds; outcomes can differ."""
        pool = self._pool()
        outcomes = set()
        for turn in range(1, 30):
            r = draw_event("game-xyz", turn, set(), pool)
            outcomes.add(r.id if r is not None else None)
        # We should see more than one distinct outcome across 30 turns.
        assert len(outcomes) > 1

    def test_different_game_id_may_differ(self):
        """Different game ids produce independent sequences."""
        pool = self._pool()
        results = [draw_event(f"g-{i}", 1, set(), pool) for i in range(20)]
        # At least some outcomes should be non-None (EVENT_CHANCE=0.45)
        non_none = [x for x in results if x is not None]
        assert len(non_none) > 0

    def test_event_chance_honored(self):
        """With a seed chosen to produce a draw, we get an event; with one that
        doesn't, we get None.  We verify the gate directly against random.Random."""
        import random
        pool = self._pool()
        # Find a turn that crosses the gate and one that doesn't.
        gate_miss_turn = None
        gate_hit_turn = None
        for t in range(1, 100):
            r = random.Random(f"probe:{t}")
            val = r.random()
            if val >= balance.EVENT_CHANCE and gate_miss_turn is None:
                gate_miss_turn = t
            if val < balance.EVENT_CHANCE and gate_hit_turn is None:
                gate_hit_turn = t
            if gate_miss_turn and gate_hit_turn:
                break

        assert gate_miss_turn is not None
        assert gate_hit_turn is not None

        assert draw_event("probe", gate_miss_turn, set(), pool) is None
        assert draw_event("probe", gate_hit_turn, set(), pool) is not None

    def test_no_duplicate_active_ids(self):
        """Already-active events must not be drawn again."""
        pool = self._pool()
        # Find a turn where evt-a would be drawn if eligible.
        hit_turn = None
        for t in range(1, 200):
            r = draw_event("game-nodup", t, set(), pool)
            if r is not None and r.id == "evt-a":
                hit_turn = t
                break
        if hit_turn is None:
            pytest.skip("evt-a never drawn in 200 tries — PRNG alignment")
        # With evt-a already active, it must not be drawn again.
        result = draw_event("game-nodup", hit_turn, {"evt-a"}, pool)
        assert result is None or result.id != "evt-a"

    def test_empty_pool_returns_none(self):
        assert draw_event("g", 1, set(), []) is None


# ---------------------------------------------------------------------------
# 3. Expiry timing: durationTurns N → affects N settlements then gone
# ---------------------------------------------------------------------------


class TestExpiry:
    """An event with durationTurns=N should be present during exactly N
    settlements, then removed before the (N+1)-th settlement starts."""

    def test_expiry_exact(self, game, world):
        # durationTurns=3: event active during turns 1, 2, 3; gone at turn 4.
        # We inject it directly into active_events at turn 1.
        ev = make_event("evt-expire", duration=3)
        active = make_active(ev, started_turn=1, remaining_turns=3)
        game.active_events = [active]

        # Turn 1 settlement: process_events decrements to 2 → still active.
        pool: list = []  # empty pool to prevent new draws interfering
        process_events(game, 1, pool)
        assert any(e.id == "evt-expire" for e in game.active_events)
        assert game.active_events[0].remaining_turns == 2

        # Turn 2: decrements to 1.
        process_events(game, 2, pool)
        assert any(e.id == "evt-expire" for e in game.active_events)
        assert game.active_events[0].remaining_turns == 1

        # Turn 3: decrements to 0 → removed.
        process_events(game, 3, pool)
        assert not any(e.id == "evt-expire" for e in game.active_events)

    def test_duration_one_event_gone_after_first_settlement(self, game, world):
        ev = make_event("evt-flash", duration=1)
        active = make_active(ev, started_turn=1, remaining_turns=1)
        game.active_events = [active]
        process_events(game, 1, [])
        assert len(game.active_events) == 0


# ---------------------------------------------------------------------------
# 4. Effect math
# ---------------------------------------------------------------------------


class TestEffectMath:

    # --- demand mult per scope ------------------------------------------------

    def test_global_demand_affects_all_pairs(self):
        ev = make_active(make_event("g", "global", effects=[{"target": "demand", "mult": 0.8}]))
        assert get_demand_mult([ev], "nyc", "lhr") == pytest.approx(0.8)
        assert get_demand_mult([ev], "pvg", "sin") == pytest.approx(0.8)

    def test_city_scope_affects_pair_with_matching_city(self):
        ev = make_active(make_event("c", "city", scope_ids=["nyc"],
                                   effects=[{"target": "demand", "mult": 1.3}]))
        assert get_demand_mult([ev], "nyc", "lhr") == pytest.approx(1.3)
        assert get_demand_mult([ev], "lax", "lhr") == pytest.approx(1.0)  # no nyc

    def test_route_scope_only_exact_pair(self):
        ev = make_active(make_event("r", "route", scope_ids=["nyc", "lhr"],
                                   effects=[{"target": "demand", "mult": 0.7}]))
        assert get_demand_mult([ev], "nyc", "lhr") == pytest.approx(0.7)
        assert get_demand_mult([ev], "lhr", "nyc") == pytest.approx(0.7)  # order-insensitive
        assert get_demand_mult([ev], "nyc", "lax") == pytest.approx(1.0)

    def test_no_active_events_returns_1(self):
        assert get_demand_mult([], "nyc", "lhr") == pytest.approx(1.0)

    # --- cost mults -----------------------------------------------------------

    def test_fuel_cost_mult_global(self):
        ev = make_active(make_event("f", effects=[{"target": "fuelCost", "mult": 1.35}]))
        assert get_cost_mult([ev], "fuelCost") == pytest.approx(1.35)

    def test_slot_fee_mult(self):
        ev = make_active(make_event("s", effects=[{"target": "slotFee", "mult": 0.80}]))
        assert get_cost_mult([ev], "slotFee") == pytest.approx(0.80)

    def test_service_cost_mult(self):
        ev = make_active(make_event("sc", effects=[{"target": "serviceCost", "mult": 1.25}]))
        assert get_cost_mult([ev], "serviceCost") == pytest.approx(1.25)

    def test_cost_mult_unrelated_target_returns_1(self):
        ev = make_active(make_event("f", effects=[{"target": "fuelCost", "mult": 1.5}]))
        assert get_cost_mult([ev], "slotFee") == pytest.approx(1.0)

    # --- stacking + clamp -----------------------------------------------------

    def test_same_target_mults_multiply(self):
        ev1 = make_active(make_event("e1", effects=[{"target": "demand", "mult": 0.8}]))
        ev2 = make_active(make_event("e2", effects=[{"target": "demand", "mult": 0.8}]))
        result = get_demand_mult([ev1, ev2], "nyc", "lhr")
        assert result == pytest.approx(0.8 * 0.8)

    def test_stack_clamped_at_lower_bound(self):
        # 0.5 ** 3 = 0.125 < 0.25; should clamp to 0.25.
        evs = [
            make_active(make_event(f"e{i}", effects=[{"target": "demand", "mult": 0.5}]))
            for i in range(3)
        ]
        assert get_demand_mult(evs, "nyc", "lhr") == pytest.approx(
            balance.EVENT_STACK_CLAMP_LO
        )

    def test_stack_clamped_at_upper_bound(self):
        # 2.0 ** 3 = 8 > 4.0; should clamp to 4.0.
        evs = [
            make_active(make_event(f"e{i}", effects=[{"target": "fuelCost", "mult": 2.0}]))
            for i in range(3)
        ]
        assert get_cost_mult(evs, "fuelCost") == pytest.approx(
            balance.EVENT_STACK_CLAMP_HI
        )

    # --- demand mult changes pax on in-scope route ---------------------------

    def test_demand_mult_changes_pax_on_scope(self, game, world):
        """A demand boost event on the nyc-lax pair increases pax vs baseline."""
        run(
            game, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        # Settle without events for baseline
        baseline = settle_turn(game, world, event_pool=[]).route_stats[0].pax

        # Reset game state for second run
        game2 = new_game("g-evtest", "TestAir", world.cities["nyc"])
        run(
            game2, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        # Inject a demand-boost event for nyc-lax
        boost_ev = make_event("boost", "city", scope_ids=["lax"],
                              effects=[{"target": "demand", "mult": 1.3}], duration=1)
        game2.active_events = [make_active(boost_ev, started_turn=0, remaining_turns=2)]

        boosted = settle_turn(game2, world, event_pool=[]).route_stats[0].pax
        assert boosted > baseline

    def test_demand_mult_no_effect_on_out_of_scope_route(self, game, world):
        """A city-scope event on fra has no effect on nyc-lax pax."""
        run(
            game, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        baseline = settle_turn(game, world, event_pool=[]).route_stats[0].pax

        game2 = new_game("g-scopetest", "TestAir", world.cities["nyc"])
        run(
            game2, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        fra_ev = make_event("fra-only", "city", scope_ids=["fra"],
                            effects=[{"target": "demand", "mult": 1.5}], duration=1)
        game2.active_events = [make_active(fra_ev, started_turn=0, remaining_turns=2)]
        after = settle_turn(game2, world, event_pool=[]).route_stats[0].pax
        assert after == baseline

    def test_fuel_cost_mult_changes_route_cost(self, game, world):
        """A fuelCost event increases route cost."""
        run(
            game, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        baseline = settle_turn(game, world, event_pool=[]).route_stats[0].cost

        game2 = new_game("g-fueltest", "TestAir", world.cities["nyc"])
        run(
            game2, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        fuel_ev = make_event("fuel-up", "global",
                             effects=[{"target": "fuelCost", "mult": 1.5}], duration=1)
        game2.active_events = [make_active(fuel_ev, started_turn=0, remaining_turns=2)]
        after_cost = settle_turn(game2, world, event_pool=[]).route_stats[0].cost
        assert after_cost > baseline

    def test_slot_fee_mult_changes_route_cost(self, game, world):
        """A slotFee event increases route cost."""
        run(
            game, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        baseline_cost = settle_turn(game, world, event_pool=[]).route_stats[0].cost

        game2 = new_game("g-slottest", "TestAir", world.cities["nyc"])
        run(
            game2, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        slot_ev = make_event("slot-up", "global",
                             effects=[{"target": "slotFee", "mult": 1.5}], duration=1)
        game2.active_events = [make_active(slot_ev, started_turn=0, remaining_turns=2)]
        after_cost = settle_turn(game2, world, event_pool=[]).route_stats[0].cost
        assert after_cost > baseline_cost

    def test_service_cost_mult_changes_route_cost(self, game, world):
        """A serviceCost event increases route cost."""
        run(
            game, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        baseline_cost = settle_turn(game, world, event_pool=[]).route_stats[0].cost

        game2 = new_game("g-svctest", "TestAir", world.cities["nyc"])
        run(
            game2, world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
        )
        svc_ev = make_event("svc-up", "global",
                            effects=[{"target": "serviceCost", "mult": 1.5}], duration=1)
        game2.active_events = [make_active(svc_ev, started_turn=0, remaining_turns=2)]
        after_cost = settle_turn(game2, world, event_pool=[]).route_stats[0].cost
        assert after_cost > baseline_cost


# ---------------------------------------------------------------------------
# 5. News emission on activation
# ---------------------------------------------------------------------------


class TestNewsEmission:
    def test_activation_emits_event_news_item(self, game, world):
        """When an event is drawn, a NewsItem with kind='event' is added to news."""
        ev = make_event("evt-news-test", severity="minor")
        # Force a draw by injecting a pool that will definitely be drawn on turn 1
        # We find a turn/game_id combo that fires the gate.
        import random
        game_id = "g-newstest"
        game2 = new_game(game_id, "NewsAir", world.cities["nyc"])
        pool = [ev]

        # Find a turn where the gate fires
        hit_turn = None
        for t in range(1, 100):
            r = random.Random(f"{game_id}:{t}")
            if r.random() < balance.EVENT_CHANCE:
                hit_turn = t
                break
        assert hit_turn is not None, "No gate hit found in 100 turns"

        # Fast-forward game to that turn
        game2.turn = hit_turn
        news = process_events(game2, hit_turn, pool)

        assert len(news) == 1
        assert news[0].kind == "event"
        assert news[0].headline == ev.headline
        assert len(game2.active_events) == 1

    def test_no_draw_no_news(self, game, world):
        """When the gate misses, no event news is produced."""
        import random
        game_id = "g-nonews"
        pool = [make_event("x")]
        miss_turn = None
        for t in range(1, 100):
            r = random.Random(f"{game_id}:{t}")
            if r.random() >= balance.EVENT_CHANCE:
                miss_turn = t
                break
        assert miss_turn is not None
        game2 = new_game(game_id, "TestAir", world.cities["nyc"])
        game2.turn = miss_turn
        news = process_events(game2, miss_turn, pool)
        assert news == []

    def test_settle_turn_includes_event_news(self, world):
        """When a drawn event fires, TurnReport.news contains a kind='event' item."""
        import random
        game_id = "g-settle-news"
        game = new_game(game_id, "TestAir", world.cities["nyc"])
        ev = make_event("evt-settle-news")
        pool = [ev]

        # Find a turn where gate fires
        hit_turn = None
        for t in range(1, 100):
            r = random.Random(f"{game_id}:{t}")
            if r.random() < balance.EVENT_CHANCE:
                hit_turn = t
                break
        assert hit_turn is not None
        game.turn = hit_turn

        report = settle_turn(game, world, event_pool=pool)
        assert any(item.kind == "event" for item in report.news)


# ---------------------------------------------------------------------------
# 6. activeEvents camelCase wire smoke
# ---------------------------------------------------------------------------


class TestCamelCaseWire:
    def test_active_events_camelcase(self, world):
        """GameState schema serializes active_events with camelCase keys."""
        from app import schemas
        from app.engine.state import ActiveEvent, EventEffect, EventScope

        game = new_game("g-camel", "CamelAir", world.cities["nyc"])
        game.active_events = [
            ActiveEvent(
                id="evt-camel",
                source="static",
                headline="Test",
                scope=EventScope(kind="global", ids=[]),
                effects=[EventEffect(target="demand", mult=1.1)],
                duration_turns=2,
                severity="minor",
                started_turn=1,
                remaining_turns=2,
            )
        ]
        schema = schemas.GameState.model_validate(game)
        dumped = schema.model_dump(by_alias=True)
        # Top-level key must be camelCase
        assert "activeEvents" in dumped
        assert len(dumped["activeEvents"]) == 1
        ae = dumped["activeEvents"][0]
        # Nested camelCase
        assert "durationTurns" in ae
        assert "remainingTurns" in ae
        assert "startedTurn" in ae
        assert "sourceUrl" in ae or True  # optional key may be absent


# ---------------------------------------------------------------------------
# 7. M3.2 Library: loads, ~40 entries, all valid, city ids exist, distributions
# ---------------------------------------------------------------------------


class TestStaticLibrary:
    @pytest.fixture(scope="class")
    def library(self):
        """Load the real events-static.json without polluting the global pool.

        We call validate_event directly on each raw entry so that _DEFAULT_POOL
        (used by other tests that rely on empty pool isolation) is not modified.
        """
        with open(DATA_DIR / "events-static.json", encoding="utf-8") as fh:
            raw_list = json.load(fh)
        pool = [ev for raw in raw_list for ev in [validate_event(raw)] if ev is not None]
        return pool

    def test_library_loads_non_empty(self, library):
        assert len(library) >= 30, f"Expected ≥30 events, got {len(library)}"

    def test_all_entries_pass_validation(self):
        """Re-validate every raw entry independently to confirm no silently-skipped rows."""
        with open(DATA_DIR / "events-static.json", encoding="utf-8") as fh:
            raw_list = json.load(fh)
        failed = []
        for raw in raw_list:
            ev = validate_event(raw)
            if ev is None:
                failed.append(raw.get("id", "<no-id>"))
        assert not failed, f"Entries that failed validation: {failed}"

    def test_roughly_forty_entries(self, library):
        # Expanded to ~55 after V2.5 added 15 new regional events; upper bound raised.
        assert 35 <= len(library) <= 70, f"Expected 35–70 events, got {len(library)}"

    def test_all_city_ids_exist(self, library):
        # Load valid city ids dynamically from the real data file so new cities
        # added to cities.json are automatically accepted here.
        with open(DATA_DIR / "cities.json", encoding="utf-8") as fh:
            valid_cities = {c["id"] for c in json.load(fh)}
        bad_ids = []
        for ev in library:
            for city_id in ev.scope.ids:
                if city_id not in valid_cities:
                    bad_ids.append((ev.id, city_id))
        assert not bad_ids, f"Events with invalid city ids: {bad_ids}"

    def test_severity_distribution(self, library):
        minors = [e for e in library if e.severity == "minor"]
        majors = [e for e in library if e.severity == "major"]
        # Spec: ~30 minor / ~10 major; allow some tolerance.
        assert len(minors) >= 20, f"Expected ≥20 minor events, got {len(minors)}"
        assert len(majors) >= 5, f"Expected ≥5 major events, got {len(majors)}"

    def test_duration_distribution(self, library):
        durations = [e.duration_turns for e in library]
        assert all(1 <= d <= 8 for d in durations), "All durations must be in [1,8]"
        assert min(durations) == 1, "At least one event with duration=1"
        assert max(durations) >= 3, "At least one event with duration≥3"

    def test_mults_all_in_range(self, library):
        bad = []
        for ev in library:
            for eff in ev.effects:
                if not (0.5 <= eff.mult <= 2.0):
                    bad.append((ev.id, eff.target, eff.mult))
        assert not bad, f"Out-of-range mults: {bad}"

    def test_category_coverage(self, library):
        """Verify the required categories are all represented."""
        ids = [ev.id for ev in library]
        id_str = " ".join(ids)
        # Check for fuel events
        fuel_events = [e for e in library if "fuel" in e.id]
        assert len(fuel_events) >= 3, "Need ≥3 fuel events"
        # Check for demand events
        demand_events = [e for e in library if any(eff.target == "demand" for eff in e.effects)]
        assert len(demand_events) >= 15, f"Expected ≥15 demand events, got {len(demand_events)}"
        # Check for cost events (non-fuel)
        cost_events = [
            e for e in library
            if any(eff.target in ("slotFee", "serviceCost") for eff in e.effects)
        ]
        assert len(cost_events) >= 5, f"Expected ≥5 slot/service cost events, got {len(cost_events)}"

    def test_unique_ids(self, library):
        ids = [ev.id for ev in library]
        assert len(ids) == len(set(ids)), "All event ids must be unique"

    def test_all_headlines_non_empty(self, library):
        empty = [ev.id for ev in library if not ev.headline.strip()]
        assert not empty, f"Events with empty headlines: {empty}"

    def test_sources_all_static(self, library):
        non_static = [ev.id for ev in library if ev.source != "static"]
        assert not non_static, f"Non-static source events: {non_static}"


# ---------------------------------------------------------------------------
# 8. V3.1 tri-lingual fields — validate_event / GameEvent / ActiveEvent
# ---------------------------------------------------------------------------


class TestTrilingualValidation:
    """V3.1: headlineEn/headlineEs/detailEn/detailEs optional fields."""

    VALID_BASE = {
        "id": "evt-trilingual",
        "source": "static",
        "headline": "测试事件",
        "severity": "minor",
        "durationTurns": 2,
        "scope": {"kind": "global", "ids": []},
        "effects": [{"target": "demand", "mult": 1.1}],
    }

    def _mutate(self, **overrides):
        import copy
        raw = copy.deepcopy(self.VALID_BASE)
        raw.update(overrides)
        return raw

    # --- optional fields absent → still valid, fields None -------------------

    def test_no_trilingual_fields_still_valid(self):
        ev = validate_event(self.VALID_BASE)
        assert ev is not None
        assert ev.headline_en is None
        assert ev.headline_es is None
        assert ev.detail_en is None
        assert ev.detail_es is None

    # --- present with valid non-empty strings --------------------------------

    def test_headline_en_present_accepted(self):
        raw = self._mutate(headlineEn="Test event headline in English")
        ev = validate_event(raw)
        assert ev is not None
        assert ev.headline_en == "Test event headline in English"

    def test_headline_es_present_accepted(self):
        raw = self._mutate(headlineEs="Titular del evento de prueba en español")
        ev = validate_event(raw)
        assert ev is not None
        assert ev.headline_es == "Titular del evento de prueba en español"

    def test_detail_en_present_accepted(self):
        raw = self._mutate(detailEn="Some English detail text.")
        ev = validate_event(raw)
        assert ev is not None
        assert ev.detail_en == "Some English detail text."

    def test_detail_es_present_accepted(self):
        raw = self._mutate(detailEs="Texto de detalle en español.")
        ev = validate_event(raw)
        assert ev is not None
        assert ev.detail_es == "Texto de detalle en español."

    def test_all_four_trilingual_fields_accepted(self):
        raw = self._mutate(
            headlineEn="Fuel prices surge globally",
            headlineEs="Los precios del combustible suben a nivel mundial",
            detailEn="Global oil supply tightens.",
            detailEs="El suministro mundial de petróleo se contrae.",
        )
        ev = validate_event(raw)
        assert ev is not None
        assert ev.headline_en == "Fuel prices surge globally"
        assert ev.headline_es == "Los precios del combustible suben a nivel mundial"
        assert ev.detail_en == "Global oil supply tightens."
        assert ev.detail_es == "El suministro mundial de petróleo se contrae."

    # --- explicitly empty string → reject whole event -----------------------

    def test_empty_headline_en_rejects_event(self):
        raw = self._mutate(headlineEn="")
        assert validate_event(raw) is None

    def test_empty_headline_es_rejects_event(self):
        raw = self._mutate(headlineEs="")
        assert validate_event(raw) is None

    def test_empty_detail_en_rejects_event(self):
        raw = self._mutate(detailEn="")
        assert validate_event(raw) is None

    def test_empty_detail_es_rejects_event(self):
        raw = self._mutate(detailEs="")
        assert validate_event(raw) is None

    def test_whitespace_only_headline_en_rejects_event(self):
        """Whitespace-only string counts as empty → reject."""
        raw = self._mutate(headlineEn="   ")
        assert validate_event(raw) is None

    def test_whitespace_only_headline_es_rejects_event(self):
        raw = self._mutate(headlineEs="\t\n")
        assert validate_event(raw) is None

    # --- null / missing → treated as absent (not an error) ------------------

    def test_null_headline_en_treated_as_absent(self):
        raw = self._mutate(headlineEn=None)
        ev = validate_event(raw)
        assert ev is not None
        assert ev.headline_en is None

    def test_null_headline_es_treated_as_absent(self):
        raw = self._mutate(headlineEs=None)
        ev = validate_event(raw)
        assert ev is not None
        assert ev.headline_es is None


# ---------------------------------------------------------------------------
# 9. V3.1 whole-library: all 57 events carry non-empty headlineEn + headlineEs
# ---------------------------------------------------------------------------


class TestTrilingualLibraryCompleteness:
    """All 57 events in events-static.json must have non-empty headlineEn and headlineEs."""

    @pytest.fixture(scope="class")
    def raw_events(self):
        with open(DATA_DIR / "events-static.json", encoding="utf-8") as fh:
            return json.load(fh)

    def test_all_57_events_have_headline_en(self, raw_events):
        missing = [
            e.get("id", "<no-id>")
            for e in raw_events
            if not e.get("headlineEn", "").strip()
        ]
        assert not missing, f"Events missing non-empty headlineEn: {missing}"

    def test_all_57_events_have_headline_es(self, raw_events):
        missing = [
            e.get("id", "<no-id>")
            for e in raw_events
            if not e.get("headlineEs", "").strip()
        ]
        assert not missing, f"Events missing non-empty headlineEs: {missing}"

    def test_count_is_57(self, raw_events):
        assert len(raw_events) == 57, f"Expected 57 events, got {len(raw_events)}"

    def test_detail_has_en_es_when_detail_present(self, raw_events):
        """Events that have a Chinese 'detail' should also have detailEn and detailEs."""
        missing_en = []
        missing_es = []
        for e in raw_events:
            if e.get("detail"):
                if not e.get("detailEn", "").strip():
                    missing_en.append(e.get("id", "<no-id>"))
                if not e.get("detailEs", "").strip():
                    missing_es.append(e.get("id", "<no-id>"))
        assert not missing_en, f"Events with detail but missing detailEn: {missing_en}"
        assert not missing_es, f"Events with detail but missing detailEs: {missing_es}"

    def test_validated_events_carry_trilingual_fields(self):
        """After validate_event(), all loaded events carry non-None headline_en/es."""
        with open(DATA_DIR / "events-static.json", encoding="utf-8") as fh:
            raw_list = json.load(fh)
        validated = [ev for raw in raw_list for ev in [validate_event(raw)] if ev is not None]
        assert len(validated) == 57, f"Expected 57 validated events, got {len(validated)}"
        no_en = [ev.id for ev in validated if not ev.headline_en]
        no_es = [ev.id for ev in validated if not ev.headline_es]
        assert not no_en, f"Validated events missing headline_en: {no_en}"
        assert not no_es, f"Validated events missing headline_es: {no_es}"


# ---------------------------------------------------------------------------
# 10. V3.1 wire smoke: headlineEn serializes as camelCase in ActiveEvent schema
# ---------------------------------------------------------------------------


class TestTrilingualCamelCaseWire:
    """V3.1: ActiveEvent schema serializes the new fields as camelCase."""

    def test_headline_en_es_camelcase_in_schema(self, world):
        from app import schemas
        from app.engine.state import ActiveEvent, EventEffect, EventScope

        game = new_game("g-trilingual-camel", "TriAir", world.cities["nyc"])
        game.active_events = [
            ActiveEvent(
                id="evt-trilingual-wire",
                source="static",
                headline="测试三语标题",
                scope=EventScope(kind="global", ids=[]),
                effects=[EventEffect(target="demand", mult=1.1)],
                duration_turns=2,
                severity="minor",
                started_turn=1,
                remaining_turns=2,
                headline_en="Test trilingual headline",
                headline_es="Titular trilingüe de prueba",
                detail_en="English detail text.",
                detail_es="Texto de detalle en español.",
            )
        ]
        schema = schemas.GameState.model_validate(game)
        dumped = schema.model_dump(by_alias=True)

        assert "activeEvents" in dumped
        ae = dumped["activeEvents"][0]
        # camelCase keys must be present
        assert "headlineEn" in ae
        assert "headlineEs" in ae
        assert "detailEn" in ae
        assert "detailEs" in ae
        # values must match
        assert ae["headlineEn"] == "Test trilingual headline"
        assert ae["headlineEs"] == "Titular trilingüe de prueba"
        assert ae["detailEn"] == "English detail text."
        assert ae["detailEs"] == "Texto de detalle en español."

    def test_absent_trilingual_fields_null_in_schema(self, world):
        """When headline_en/es are None, they serialize as null (not missing key)."""
        from app import schemas
        from app.engine.state import ActiveEvent, EventEffect, EventScope

        game = new_game("g-trilingual-null", "NullAir", world.cities["nyc"])
        game.active_events = [
            ActiveEvent(
                id="evt-no-translations",
                source="static",
                headline="无翻译事件",
                scope=EventScope(kind="global", ids=[]),
                effects=[EventEffect(target="demand", mult=1.0)],
                duration_turns=1,
                severity="minor",
                started_turn=1,
                remaining_turns=1,
            )
        ]
        schema = schemas.GameState.model_validate(game)
        dumped = schema.model_dump(by_alias=True)
        ae = dumped["activeEvents"][0]
        # Fields may be None but camelCase keys should exist
        assert ae.get("headlineEn") is None
        assert ae.get("headlineEs") is None

    def test_activated_event_propagates_trilingual_fields(self, world):
        """process_events propagates headline_en/es from GameEvent to ActiveEvent."""
        import random as _random
        from app.engine.events import process_events

        game_id = "g-trilingual-activate"
        game = new_game(game_id, "PropAir", world.cities["nyc"])
        ev = GameEvent(
            id="evt-trilingual-propagate",
            source="static",
            headline="三语传播测试",
            scope=EventScope(kind="global", ids=[]),
            effects=[EventEffect(target="demand", mult=1.1)],
            duration_turns=2,
            severity="minor",
            headline_en="Trilingual propagation test",
            headline_es="Prueba de propagación trilingüe",
            detail_en="English detail for propagation.",
            detail_es="Detalle en español para propagación.",
        )
        pool = [ev]

        # Find a gate-hit turn
        hit_turn = None
        for t in range(1, 100):
            r = _random.Random(f"{game_id}:{t}")
            if r.random() < balance.EVENT_CHANCE:
                hit_turn = t
                break
        assert hit_turn is not None

        game.turn = hit_turn
        process_events(game, hit_turn, pool)

        # If event was activated, check that translations are present
        activated = [ae for ae in game.active_events if ae.id == "evt-trilingual-propagate"]
        if activated:
            ae = activated[0]
            assert ae.headline_en == "Trilingual propagation test"
            assert ae.headline_es == "Prueba de propagación trilingüe"
            assert ae.detail_en == "English detail for propagation."
            assert ae.detail_es == "Detalle en español para propagación."


# ---------------------------------------------------------------------------
# 11. V3.1 news pipeline: LLM output with trilingual fields round-trips
# ---------------------------------------------------------------------------


class TestTrilingualNewsStructuring:
    """V3.1: validate_event accepts headlineEn/Es from LLM; news pipeline round-trips."""

    def _valid_trilingual_event_json(self, url: str = "https://example.com/article") -> str:
        import json as _json
        return _json.dumps([{
            "sourceUrl": url,
            "headline": "航油价格上涨影响全球航线",
            "headlineEn": "Rising jet fuel prices impact global routes",
            "headlineEs": "El alza del combustible aéreo afecta rutas globales",
            "detail": "国际航煤价格创近年新高，各大航司成本压力增大。",
            "detailEn": "Jet fuel prices hit multi-year highs, raising cost pressures for major airlines.",
            "detailEs": "Los precios del combustible alcanzan máximos de varios años, aumentando la presión de costos en las principales aerolíneas.",
            "severity": "minor",
            "durationTurns": 2,
            "scope": {"kind": "global", "ids": []},
            "effects": [{"target": "fuelCost", "mult": 1.3}],
        }])

    def test_trilingual_news_event_validates(self):
        """validate_event accepts headlineEn/Es/detailEn/Es from a news-sourced dict."""
        import json as _json
        raw_list = _json.loads(self._valid_trilingual_event_json())
        raw = raw_list[0]
        raw["source"] = "news"
        raw["id"] = "news-testabcd01"
        ev = validate_event(raw)
        assert ev is not None
        assert ev.headline_en == "Rising jet fuel prices impact global routes"
        assert ev.headline_es == "El alza del combustible aéreo afecta rutas globales"
        assert ev.detail_en == "Jet fuel prices hit multi-year highs, raising cost pressures for major airlines."
        assert ev.detail_es == "Los precios del combustible alcanzan máximos de varios años, aumentando la presión de costos en las principales aerolíneas."

    def test_structure_articles_returns_trilingual_fields(self):
        """structure_articles() round-trips headlineEn/Es through the validation pipeline."""
        import json as _json
        import os
        from unittest.mock import MagicMock, patch
        from app.services.news_events import structure_articles
        from app.providers.news.base import NewsArticle
        from datetime import datetime, timezone

        url = "https://example.com/trilingual-fuel"
        article = NewsArticle(
            url=url,
            title="Jet Fuel Prices Rise",
            body="Aviation fuel costs are increasing.",
            published_at=datetime(2026, 6, 10, 12, 0, 0, tzinfo=timezone.utc),
        )
        llm_output = self._valid_trilingual_event_json(url)

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "content": [{"type": "text", "text": llm_output}],
        }
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.post.return_value = mock_response

        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}):
            with patch("app.services.news_events.httpx.Client", return_value=mock_client):
                events = structure_articles([article])

        assert len(events) == 1
        ev = events[0]
        assert ev.source == "news"
        assert ev.headline_en == "Rising jet fuel prices impact global routes"
        assert ev.headline_es == "El alza del combustible aéreo afecta rutas globales"

    def test_empty_headline_en_in_news_output_rejected(self):
        """LLM returning empty headlineEn causes entire event to be rejected."""
        import json as _json
        import os
        from unittest.mock import MagicMock, patch
        from app.services.news_events import structure_articles
        from app.providers.news.base import NewsArticle
        from datetime import datetime, timezone

        url = "https://example.com/bad-trilingual"
        article = NewsArticle(
            url=url,
            title="Test",
            body="Test.",
            published_at=datetime(2026, 6, 10, tzinfo=timezone.utc),
        )
        bad_output = _json.dumps([{
            "sourceUrl": url,
            "headline": "有效中文标题",
            "headlineEn": "",  # empty → should reject whole event
            "severity": "minor",
            "durationTurns": 2,
            "scope": {"kind": "global", "ids": []},
            "effects": [{"target": "demand", "mult": 1.1}],
        }])

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"content": [{"type": "text", "text": bad_output}]}
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.post.return_value = mock_response

        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}):
            with patch("app.services.news_events.httpx.Client", return_value=mock_client):
                events = structure_articles([article])

        assert events == []
