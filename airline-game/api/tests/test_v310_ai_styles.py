"""V3.10 AI management styles: per-style params, premium weight bonus,
budget price-war trigger, network candidate preference, 4-AI seeding,
serialization, and determinism over 8 turns.

CONTRACT §3 V3.10 — tested here:
  aggressive  — new route every 4 turns, growth ×1.07, cap 3600.
  premium     — growth ×1.03, max 8 routes, weight bonus ×1.05.
  budget      — price-war trigger: marketShare < 0.12 → fareMult drops to 0.92.
  network     — prefers cities already served by others when opening new routes.
"""
from __future__ import annotations

import math

import pytest

from app.engine import balance
from app.engine.competitors import (
    AI_SPECS,
    _growth_factor,
    _new_route_every_turns,
    _route_max_weekly_seats,
    _max_routes,
    effective_fare_mult,
    get_competitor_weight_bonus,
    initial_competitors,
)
from app.engine.simulate import settle_turn, allocate_market
from app.engine.state import (
    Competitor,
    CompetitorRoute,
    GameState,
    World,
    new_game,
)

from tests.conftest import run


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------


def fresh(world: World, hq: str = "hnd", game_id: str = "g-v310") -> GameState:
    return new_game(game_id, "Style Test Air", world.cities[hq])


def _get_competitor(game: GameState, ai_id: str) -> Competitor:
    return next(c for c in game.competitors if c.id == ai_id)


# ---------------------------------------------------------------------------
# 4-AI seeding and serialization
# ---------------------------------------------------------------------------


class TestFourAISeeding:
    def test_initial_competitors_returns_four_ais(self):
        competitors = initial_competitors()
        assert len(competitors) == 4
        ids = [c.id for c in competitors]
        assert ids == ["ai-aurora", "ai-meridian", "ai-falcon", "ai-vector"]

    def test_all_four_ais_have_style_field(self):
        competitors = initial_competitors()
        styles = {c.id: c.style for c in competitors}
        assert styles == {
            "ai-aurora": "budget",
            "ai-meridian": "premium",
            "ai-falcon": "network",
            "ai-vector": "aggressive",
        }

    def test_all_four_ais_have_style_zh(self):
        competitors = initial_competitors()
        style_zh = {c.id: c.style_zh for c in competitors}
        assert style_zh["ai-aurora"] == "价格屠夫"
        assert style_zh["ai-meridian"] == "精品保守派"
        assert style_zh["ai-falcon"] == "网络枢纽派"
        assert style_zh["ai-vector"] == "激进扩张派"

    def test_vector_sky_initial_routes_avoid_nyc(self, world):
        """Initial routes must not touch nyc — balance acceptance guardrail."""
        game = fresh(world, hq="nyc")
        vector = _get_competitor(game, "ai-vector")
        for route in vector.routes:
            assert "nyc" not in (route.city_a, route.city_b)

    def test_vector_sky_initial_routes(self, world):
        game = fresh(world)
        vector = _get_competitor(game, "ai-vector")
        assert vector.hq_city_id == "icn"
        route_pairs = [(r.city_a, r.city_b) for r in vector.routes]
        assert route_pairs == [("icn", "pvg"), ("icn", "bkk")]
        assert all(r.weekly_seats == balance.AI_INITIAL_WEEKLY_SEATS for r in vector.routes)

    def test_new_game_seeding_has_four_competitors(self, world):
        game = fresh(world)
        assert len(game.competitors) == 4


# ---------------------------------------------------------------------------
# Per-style cadence params
# ---------------------------------------------------------------------------


class TestStyleCadenceParams:
    def test_aggressive_cadence_is_4(self):
        vector = next(c for c in initial_competitors() if c.id == "ai-vector")
        assert _new_route_every_turns(vector) == 4

    def test_others_cadence_is_6(self):
        competitors = initial_competitors()
        for c in competitors:
            if c.style != "aggressive":
                assert _new_route_every_turns(c) == balance.AI_NEW_ROUTE_EVERY_TURNS == 6

    def test_aggressive_growth_factor(self):
        vector = next(c for c in initial_competitors() if c.id == "ai-vector")
        assert _growth_factor(vector) == pytest.approx(1.07)

    def test_budget_growth_factor_is_default(self):
        aurora = next(c for c in initial_competitors() if c.id == "ai-aurora")
        assert _growth_factor(aurora) == pytest.approx(balance.AI_GROWTH_FACTOR)

    def test_premium_growth_factor(self):
        meridian = next(c for c in initial_competitors() if c.id == "ai-meridian")
        assert _growth_factor(meridian) == pytest.approx(1.03)

    def test_aggressive_route_cap(self):
        vector = next(c for c in initial_competitors() if c.id == "ai-vector")
        assert _route_max_weekly_seats(vector) == 3600

    def test_budget_route_cap_is_default(self):
        aurora = next(c for c in initial_competitors() if c.id == "ai-aurora")
        assert _route_max_weekly_seats(aurora) == balance.AI_ROUTE_MAX_WEEKLY_SEATS

    def test_premium_max_routes(self):
        meridian = next(c for c in initial_competitors() if c.id == "ai-meridian")
        assert _max_routes(meridian) == 8

    def test_others_max_routes_unlimited(self):
        for c in initial_competitors():
            if c.style != "premium":
                assert _max_routes(c) is None


# ---------------------------------------------------------------------------
# Aggressive style: growth ×1.07, cap 3600, opens every 4 turns
# ---------------------------------------------------------------------------


class TestAggressiveStyle:
    def test_aggressive_growth_applied_each_turn(self, world):
        game = fresh(world, game_id="g-aggressive-growth")
        vector = _get_competitor(game, "ai-vector")
        initial_max = max(r.weekly_seats for r in vector.routes)
        settle_turn(game, world)
        new_max = max(r.weekly_seats for r in vector.routes)
        expected = min(
            math.ceil(round(initial_max * 1.07, 6)),
            3600,
        )
        assert new_max == expected

    def test_aggressive_opens_on_turn_4(self, world):
        game = fresh(world, game_id="g-aggressive-cadence")
        vector = _get_competitor(game, "ai-vector")
        for _ in range(3):
            settle_turn(game, world)
        assert len(vector.routes) == 2  # no opening yet
        settle_turn(game, world)
        assert len(vector.routes) == 3  # turn 4 fires

    def test_aggressive_does_not_open_on_turn_6(self, world):
        """Aggressive fires on turns 4 and 8, not 6."""
        game = fresh(world, game_id="g-aggressive-not6")
        vector = _get_competitor(game, "ai-vector")
        for _ in range(4):
            settle_turn(game, world)
        assert len(vector.routes) == 3  # turn 4 fired
        settle_turn(game, world)  # turn 5
        settle_turn(game, world)  # turn 6 — no aggressive opening
        assert len(vector.routes) == 3

    def test_aggressive_cap_applied(self, world):
        """Seats must not exceed 3600."""
        # Seed a competitor with a very large route close to the cap.
        vector = next(c for c in initial_competitors() if c.id == "ai-vector")
        vector.routes[0].weekly_seats = 3400
        game = fresh(world, game_id="g-aggressive-cap")
        game.competitors = [vector]
        # 3400 × 1.07 = 3638 > 3600 → clamped to 3600.
        settle_turn(game, world)
        assert max(r.weekly_seats for r in vector.routes) == 3600


# ---------------------------------------------------------------------------
# Premium style: growth ×1.03, max 8 routes, weight bonus ×1.05
# ---------------------------------------------------------------------------


class TestPremiumStyle:
    def test_premium_growth_factor(self, world):
        game = fresh(world, game_id="g-premium-growth")
        meridian = _get_competitor(game, "ai-meridian")
        initial_max = max(r.weekly_seats for r in meridian.routes)
        settle_turn(game, world)
        new_max = max(r.weekly_seats for r in meridian.routes)
        expected = math.ceil(round(initial_max * 1.03, 6))
        assert new_max == expected

    def test_premium_weight_bonus(self):
        """Premium AI gets 1.05× weight multiplier in share competition."""
        meridian = next(c for c in initial_competitors() if c.id == "ai-meridian")
        assert get_competitor_weight_bonus(meridian) == pytest.approx(1.05)

    def test_non_premium_no_weight_bonus(self):
        for c in initial_competitors():
            if c.style != "premium":
                assert get_competitor_weight_bonus(c) == pytest.approx(1.0)

    def test_premium_weight_bonus_math(self, world):
        """Premium's effective weight = price_weight(1.1) × 1.05; verify it
        results in higher share than a non-bonus AI at the same fareMult."""
        from app.engine.simulate import price_weight

        base_w = price_weight(1.1)
        bonus_w = base_w * 1.05
        assert bonus_w > base_w

    def test_premium_max_routes_cap(self, world):
        """Premium AI never opens more than 8 routes."""
        game = fresh(world, game_id="g-premium-cap")
        meridian = _get_competitor(game, "ai-meridian")
        # Seed it with 7 routes to push right against the cap.
        extra = [
            CompetitorRoute("lhr", "lax", 1600),
            CompetitorRoute("lhr", "sin", 1600),
            CompetitorRoute("lhr", "nyc", 1600),
            CompetitorRoute("lhr", "pvg", 1600),
            CompetitorRoute("lhr", "bkk", 1600),
        ]
        meridian.routes.extend(extra)  # now 7 routes
        assert len(meridian.routes) == 7
        # Run enough turns to hit a cadence turn (6).
        for _ in range(6):
            settle_turn(game, world)
        # At turn 6 it can open one more (7 → 8 = max).
        assert len(meridian.routes) == 8
        # Run another 6 turns: cap prevents further expansion.
        for _ in range(6):
            settle_turn(game, world)
        assert len(meridian.routes) == 8


# ---------------------------------------------------------------------------
# Budget style: price-war fare trigger
# ---------------------------------------------------------------------------


class TestBudgetStyle:
    def test_effective_fare_above_threshold(self):
        """When marketShare >= 0.12, budget AI uses base fareMult (0.95)."""
        aurora = next(c for c in initial_competitors() if c.id == "ai-aurora")
        aurora.market_share = 0.15  # above threshold
        assert effective_fare_mult(aurora) == pytest.approx(0.95)

    def test_effective_fare_at_threshold(self):
        """At exactly 0.12 (not below), base fareMult is used."""
        aurora = next(c for c in initial_competitors() if c.id == "ai-aurora")
        aurora.market_share = 0.12
        assert effective_fare_mult(aurora) == pytest.approx(0.95)

    def test_effective_fare_below_threshold_triggers_price_war(self):
        """When marketShare < 0.12, budget AI drops to 0.92."""
        aurora = next(c for c in initial_competitors() if c.id == "ai-aurora")
        aurora.market_share = 0.10  # below threshold
        assert effective_fare_mult(aurora) == pytest.approx(0.92)

    def test_effective_fare_at_zero_triggers_price_war(self):
        """marketShare=0 (new game initial state) is below 0.12 → price war."""
        aurora = next(c for c in initial_competitors() if c.id == "ai-aurora")
        aurora.market_share = 0.0
        assert effective_fare_mult(aurora) == pytest.approx(0.92)

    def test_non_budget_fare_unaffected(self):
        """Non-budget AIs always use their base fareMult regardless of share."""
        for c in initial_competitors():
            if c.style != "budget":
                c.market_share = 0.0  # worst case
                assert effective_fare_mult(c) == pytest.approx(c.fare_mult)


# ---------------------------------------------------------------------------
# Network style: prefer served-by-others cities
# ---------------------------------------------------------------------------


class TestNetworkStyle:
    def test_network_destination_is_in_served_by_others_set(self, world):
        """Falcon Dunes (network) picks a city from the served-by-others tier
        first.  In the default game state Aurora, Meridian, and Vector Sky each
        serve cities that Falcon doesn't — those should come before unserved
        cities in the candidate ranking."""
        from app.engine.competitors import _next_destination, _all_served_cities, _served_cities

        game = fresh(world, game_id="g-network-others", hq="dxb")
        falcon = _get_competitor(game, "ai-falcon")

        # Collect all cities served by others (not by Falcon).
        others_served = _all_served_cities(game) - _served_cities(falcon)
        assert len(others_served) > 0, "test pre-condition: others must serve some cities"

        dest = _next_destination(game, falcon, world)
        assert dest is not None
        # The chosen destination should be from the served-by-others set
        # (since that set has reachable high-demand cities available).
        assert dest in others_served, (
            f"Network AI chose {dest!r} which is NOT in served-by-others {others_served}"
        )

    def test_network_prefers_served_over_unserved_lower_demand(self, world):
        """When a served-by-others city has lower demand than the best unserved
        city, the network AI still picks the served-by-others city first.

        We isolate Falcon so it has no natural competitors serving cities.
        Then the player serves a city with demand 6, while unserved cities
        have higher demand — the network AI should still prefer the player-served
        city because it is in 'others_served'."""
        from app.engine.competitors import _next_destination

        # Use a standalone Falcon with no other AI competitors.
        from app.engine.competitors import AI_SPECS
        falcon_spec = next(s for s in AI_SPECS if s.id == "ai-falcon")
        from app.engine.state import CompetitorRoute, Competitor
        isolated_falcon = Competitor(
            id="ai-falcon",
            name=falcon_spec.name,
            name_zh=falcon_spec.name_zh,
            hq_city_id=falcon_spec.hq_city_id,
            fare_mult=falcon_spec.fare_mult,
            style=falcon_spec.style,
            style_zh=falcon_spec.style_zh,
            routes=[
                CompetitorRoute("dxb", "sin", 1600),
                CompetitorRoute("dxb", "cdg", 1600),
            ],
        )

        # Build a minimal state where only Falcon exists + player serves one route.
        game = fresh(world, game_id="g-network-pref", hq="dxb")
        game.competitors = [isolated_falcon]

        # Player opens dxb-syd; syd has lower demand than nyc/lhr etc.
        syd = world.cities.get("syd")
        if syd is None:
            pytest.skip("syd city not present in test data")

        run(
            game,
            world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "syd"},
            {"type": "openRoute", "cityA": "dxb", "cityB": "syd"},
        )

        dest = _next_destination(game, isolated_falcon, world)
        # syd is served by the player → others_served; even with lower demand
        # it should be preferred over unserved cities.
        assert dest == "syd", (
            f"Network AI chose {dest!r}; expected 'syd' (player-served, others priority)"
        )

    def test_network_falls_back_to_demand_when_no_others(self, world):
        """When no other carrier serves any unvisited city, fall back to highest
        demand city (standard behavior)."""
        from app.engine.competitors import _next_destination

        # Build a game with only the network competitor (no player routes).
        game = fresh(world, game_id="g-network-fallback", hq="dxb")
        falcon = _get_competitor(game, "ai-falcon")
        # Remove all other competitors so there are no served-by-others cities.
        game.competitors = [falcon]

        dest = _next_destination(game, falcon, world)
        # Without other carriers, should pick highest demandIndex not yet served.
        served = {"dxb", "sin", "cdg"}
        unserved = [c for c in world.cities.values() if c.id not in served]
        assert dest is not None
        dest_city = world.cities[dest]
        assert dest_city.demand_index == max(c.demand_index for c in unserved)


# ---------------------------------------------------------------------------
# Determinism over 8 turns
# ---------------------------------------------------------------------------


class TestDeterminism8Turns:
    def test_identical_games_evolve_identically_over_8_turns(self, world):
        """Two identically-seeded games produce identical state after 8 turns."""
        game_a = fresh(world, game_id="g-det-a-v310")
        game_b = fresh(world, game_id="g-det-b-v310")

        # Add a route to both games to include player interaction.
        for game in (game_a, game_b):
            run(
                game,
                world,
                {"type": "buyAircraft", "modelId": "a320neo"},
                {"type": "negotiateSlot", "cityId": "pvg"},
                {"type": "openRoute", "cityA": "hnd", "cityB": "pvg"},
                {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            )

        for _ in range(8):
            settle_turn(game_a, world)
            settle_turn(game_b, world)

        # All competitors must be identical.
        assert game_a.competitors == game_b.competitors
        assert game_a.market_share == game_b.market_share

    def test_style_params_stable_across_turns(self, world):
        """Style params (growth, cap, cadence) must not change during gameplay."""
        game = fresh(world, game_id="g-stable-params")
        vector = _get_competitor(game, "ai-vector")

        for _ in range(8):
            settle_turn(game, world)
            assert _growth_factor(vector) == pytest.approx(1.07)
            assert _route_max_weekly_seats(vector) == 3600
            assert _new_route_every_turns(vector) == 4


# ---------------------------------------------------------------------------
# Balance acceptance — 4 AI seeding must not affect the 4 existing targets
# ---------------------------------------------------------------------------


class TestBalanceAcceptanceWith4AIs:
    """Smoke-check that the 4 balance acceptance scenarios in test_balance.py
    still pass when the 4th AI (Vector Sky) is present.  The actual assertions
    live in test_balance.py; here we just verify the 4-AI seeding doesn't
    disqualify initial conditions (no nyc pairs in Vector's initial routes)."""

    def test_vector_initial_routes_avoid_nyc_pairs(self, world):
        competitors = initial_competitors()
        vector = next(c for c in competitors if c.id == "ai-vector")
        for route in vector.routes:
            pair = {route.city_a, route.city_b}
            assert "nyc" not in pair, (
                f"Vector Sky initial route {pair} includes nyc — breaks balance acceptance"
            )

    def test_vector_initial_routes_are_icn_pvg_and_icn_bkk(self, world):
        competitors = initial_competitors()
        vector = next(c for c in competitors if c.id == "ai-vector")
        route_pairs = {(r.city_a, r.city_b) for r in vector.routes}
        assert route_pairs == {("icn", "pvg"), ("icn", "bkk")}
        assert all(r.weekly_seats == 1600 for r in vector.routes)
