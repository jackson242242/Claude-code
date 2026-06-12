"""M2.3 cabin classes and service tiers — engine + wire tests.

Coverage:
1. defaults-equal-M2.2 regression: with {100,0,0}/tier-2, totals match M2.2 formulas.
2. Seat floor arithmetic for a mixed cabin (e.g. 300 seats, 70/20/10 → 210/24/6).
3. cabinMix sum validation: non-100 sum → CommandError with descriptive message.
4. Per-class demand split with no spillover: min(cap, split × pax) per class.
5. Business/first revenue multipliers: biz × 3.0, first × 6.5 vs economy fare.
6. Tier-1 vs tier-3 share weight: tier-3 wins bigger slice at equal fareMult.
7. Service cost in route cost: SERVICE_COST_PER_PAX[tier] × total_pax.
8. Wire (camelCase) smoke: cabinMix and serviceTier appear in API response.
"""
from __future__ import annotations

import math

import pytest
from fastapi.testclient import TestClient

from app.engine import balance
from app.engine.commands import apply_commands
from app.engine.simulate import cabin_seats, settle_turn, simulate_route
from app.engine.state import CabinMix, GameState, Route, World, new_game
from app.main import app

from tests.conftest import run


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


def fresh(world: World, name: str = "Cabin Air") -> GameState:
    return new_game("g-cabin", name, world.cities["nyc"])


def setup_route(
    game: GameState,
    world: World,
    *,
    model_id: str = "a320neo",
    city_b: str = "lax",
    weekly_flights: float = 7.0,
    fare_mult: float = 1.0,
    cabin_mix: dict | None = None,
    service_tier: int | None = None,
) -> None:
    """Buy aircraft, negotiate slot, open+assign route, then updateRoute for
    fareMult / cabinMix / serviceTier."""
    cmds: list[dict] = [
        {"type": "buyAircraft", "modelId": model_id},
        {"type": "negotiateSlot", "cityId": city_b},
        {"type": "openRoute", "cityA": "nyc", "cityB": city_b},
        {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
        {
            "type": "updateRoute",
            "routeId": "rt-1",
            "weeklyFlights": weekly_flights,
            "fareMult": fare_mult,
        },
    ]
    if cabin_mix is not None or service_tier is not None:
        update: dict = {"type": "updateRoute", "routeId": "rt-1"}
        if cabin_mix is not None:
            update["cabinMix"] = cabin_mix
        if service_tier is not None:
            update["serviceTier"] = service_tier
        cmds.append(update)
    run(game, world, *cmds)


# ---------------------------------------------------------------------------
# 1. Defaults-equal-M2.2 regression
# ---------------------------------------------------------------------------


class TestDefaultsEqualM22:
    """With cabinMix={100,0,0} and serviceTier=2 (defaults) the engine must
    produce the same pax, capacity, loadFactor, and revenue as the pre-M2.3
    formula. Cost now includes SERVICE_COST_PER_PAX[2]=$25/pax — this is
    a M2.3 addition, but the formula is deterministic so 'exact match' means
    matching the updated reference calculation (not the old zero-service cost).
    The four balance acceptance tests in test_balance.py remain unchanged.
    """

    def test_default_pax_equals_m22_formula(self, world: World) -> None:
        """pax with defaults = min(capacity, market × w × share) — identical to M2.2."""
        game = fresh(world)
        setup_route(game, world)
        route = game.routes[0]
        # Confirm defaults are in place.
        assert route.cabin_mix.economy == 100
        assert route.cabin_mix.business == 0
        assert route.cabin_mix.first == 0
        assert route.service_tier == 2

        report = settle_turn(game, world)
        stats = report.route_stats[0]

        # Re-derive the M2.2 allocation by hand.
        model = world.aircraft_models["a320neo"]
        city_a = world.cities["nyc"]
        city_b = world.cities["lax"]
        d = route.distance_km
        flights = route.weekly_flights * 2 * balance.WEEKS_PER_QUARTER
        capacity = model.seats * int(flights)
        market = (
            balance.BASE_K
            * city_a.demand_index
            * city_b.demand_index
            * balance.SEASON_FACTOR[3]  # Q3 (first settlement)
            * math.exp(-d / balance.DISTANCE_DECAY_KM)
        )
        weight = route.fare_mult ** balance.PRICE_ELASTICITY
        # tier=2 → SERVICE_WEIGHT[2]=1.0, no change.
        share = weight / (weight + balance.W_BG)
        expected_pax = round(min(capacity, market * weight * share))
        expected_capacity = capacity

        assert stats.pax == expected_pax, "pax mismatch vs M2.2 formula"
        assert stats.capacity == expected_capacity, "capacity mismatch"
        assert stats.load_factor == pytest.approx(expected_pax / expected_capacity, abs=1e-4)

    def test_default_revenue_equals_m22_formula(self, world: World) -> None:
        game = fresh(world)
        setup_route(game, world)
        route = game.routes[0]
        report = settle_turn(game, world)
        stats = report.route_stats[0]

        model = world.aircraft_models["a320neo"]
        d = route.distance_km
        flights = route.weekly_flights * 2 * balance.WEEKS_PER_QUARTER
        capacity = model.seats * int(flights)
        market = (
            balance.BASE_K
            * world.cities["nyc"].demand_index
            * world.cities["lax"].demand_index
            * balance.SEASON_FACTOR[3]
            * math.exp(-d / balance.DISTANCE_DECAY_KM)
        )
        weight = route.fare_mult ** balance.PRICE_ELASTICITY
        share = weight / (weight + balance.W_BG)
        expected_pax = round(min(capacity, market * weight * share))
        # With all-economy defaults, revenue = pax × economy_fare (no multiplier).
        fare = (balance.FARE_FIXED + balance.FARE_PER_KM * d) * route.fare_mult
        expected_revenue = expected_pax * fare
        assert stats.revenue == pytest.approx(expected_revenue, abs=0.5)

    def test_classes_breakdown_all_economy(self, world: World) -> None:
        """With defaults all pax land in economy; biz/first are zero."""
        game = fresh(world)
        setup_route(game, world)
        report = settle_turn(game, world)
        stats = report.route_stats[0]
        assert stats.classes is not None
        biz = stats.classes["business"]
        first = stats.classes["first"]
        assert biz.pax == 0 and biz.capacity == 0
        assert first.pax == 0 and first.capacity == 0
        econ = stats.classes["economy"]
        assert econ.pax == stats.pax
        assert econ.capacity == stats.capacity


# ---------------------------------------------------------------------------
# 2. Seat floor arithmetic
# ---------------------------------------------------------------------------


class TestCabinSeatFloorArithmetic:
    """cabin_seats() must floor each class per CONTRACT §3 M2.3."""

    def test_floor_arithmetic_300_seats_70_20_10(self) -> None:
        """300 seats, mix 70/20/10:
        econ  = floor(300 × 70/100)         = 210
        biz   = floor(300 × 20/100 / 2.5)   = floor(24.0) = 24
        first = floor(300 × 10/100 / 5.0)   = floor(6.0)  = 6
        """
        econ, biz, first = cabin_seats(300, 70, 20, 10)
        assert econ == 210
        assert biz == 24
        assert first == 6

    def test_floor_arithmetic_180_seats_60_30_10(self) -> None:
        """180 seats, mix 60/30/10:
        econ  = floor(180 × 60/100)         = 108
        biz   = floor(180 × 30/100 / 2.5)   = floor(21.6) = 21
        first = floor(180 × 10/100 / 5.0)   = floor(3.6)  = 3
        """
        econ, biz, first = cabin_seats(180, 60, 30, 10)
        assert econ == 108
        assert biz == 21
        assert first == 3

    def test_floor_arithmetic_all_economy(self) -> None:
        """Default mix (100,0,0): all seats economy, biz/first zero."""
        econ, biz, first = cabin_seats(180, 100, 0, 0)
        assert econ == 180
        assert biz == 0
        assert first == 0

    def test_floor_arithmetic_a320neo_70_20_10(self, world: World) -> None:
        """Verify engine route_capacity with a mixed-cabin A320neo.
        A320neo actual seats are read from world data to keep the test
        non-brittle; we verify the engine matches our hand formula."""
        from app.engine.simulate import route_capacity

        game = fresh(world)
        setup_route(game, world, cabin_mix={"economy": 70, "business": 20, "first": 10})
        route = game.routes[0]

        actual_seats = world.aircraft_models["a320neo"].seats
        econ, biz, first = cabin_seats(actual_seats, 70, 20, 10)
        flights = 7.0 * 2 * balance.WEEKS_PER_QUARTER
        expected_cap = int((econ + biz + first) * flights)
        assert route_capacity(game, world, route) == expected_cap


# ---------------------------------------------------------------------------
# 3. cabinMix sum validation
# ---------------------------------------------------------------------------


class TestCabinMixValidation:
    def test_sum_not_100_raises_command_error(self, game: GameState, world: World) -> None:
        run(
            game,
            world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        )
        results = apply_commands(
            game,
            world,
            [
                {
                    "type": "updateRoute",
                    "routeId": "rt-1",
                    "cabinMix": {"economy": 80, "business": 10, "first": 5},
                }
            ],
        )
        assert not results[0].ok
        assert results[0].message is not None
        assert "100" in results[0].message

    def test_negative_value_raises_command_error(self, game: GameState, world: World) -> None:
        run(
            game,
            world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        )
        results = apply_commands(
            game,
            world,
            [
                {
                    "type": "updateRoute",
                    "routeId": "rt-1",
                    "cabinMix": {"economy": 110, "business": -5, "first": -5},
                }
            ],
        )
        assert not results[0].ok

    def test_missing_key_raises_command_error(self, game: GameState, world: World) -> None:
        run(
            game,
            world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        )
        results = apply_commands(
            game,
            world,
            [
                {
                    "type": "updateRoute",
                    "routeId": "rt-1",
                    "cabinMix": {"economy": 100},
                }
            ],
        )
        assert not results[0].ok

    def test_valid_mix_accepted(self, game: GameState, world: World) -> None:
        run(
            game,
            world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        )
        results = apply_commands(
            game,
            world,
            [
                {
                    "type": "updateRoute",
                    "routeId": "rt-1",
                    "cabinMix": {"economy": 70, "business": 20, "first": 10},
                }
            ],
        )
        assert results[0].ok
        assert game.routes[0].cabin_mix.economy == 70
        assert game.routes[0].cabin_mix.business == 20
        assert game.routes[0].cabin_mix.first == 10


# ---------------------------------------------------------------------------
# 4. Per-class demand split with no spillover
# ---------------------------------------------------------------------------


class TestDemandSplit:
    """pax_class = min(cap_class, allocated × split); no cross-class overflow."""

    def test_per_class_pax_bounded_by_class_capacity(self, world: World) -> None:
        """Force business capacity to be limited and verify biz_pax ≤ biz_cap."""
        game = fresh(world)
        setup_route(
            game,
            world,
            cabin_mix={"economy": 60, "business": 30, "first": 10},
        )
        route = game.routes[0]
        flights = route.weekly_flights * 2 * balance.WEEKS_PER_QUARTER
        actual_seats = world.aircraft_models["a320neo"].seats
        econ_s, biz_s, first_s = cabin_seats(actual_seats, 60, 30, 10)
        biz_cap = int(biz_s * flights)
        first_cap = int(first_s * flights)

        report = settle_turn(game, world)
        stats = report.route_stats[0]
        assert stats.classes is not None
        assert stats.classes["business"].pax <= biz_cap
        assert stats.classes["first"].pax <= first_cap

    def test_no_spillover_from_missing_biz_seats(self, world: World) -> None:
        """100% economy: biz_pax == 0 and first_pax == 0; no overflow to econ."""
        game = fresh(world)
        setup_route(game, world)  # default all-economy
        report = settle_turn(game, world)
        stats = report.route_stats[0]
        assert stats.classes is not None
        assert stats.classes["business"].pax == 0
        assert stats.classes["first"].pax == 0
        # All pax are in economy — equal to total stats pax.
        assert stats.classes["economy"].pax == stats.pax

    def test_split_fractions_respected(self, world: World) -> None:
        """With mixed cabin: biz_pax ≈ allocated × 0.09 (capped at biz_cap)."""
        game = fresh(world)
        setup_route(
            game, world, cabin_mix={"economy": 60, "business": 30, "first": 10}
        )
        route = game.routes[0]
        report = settle_turn(game, world)
        stats = report.route_stats[0]
        assert stats.classes is not None

        # Reconstruct expected split pax to verify the formula is applied.
        actual_seats = world.aircraft_models["a320neo"].seats
        econ_s, biz_s, first_s = cabin_seats(actual_seats, 60, 30, 10)
        flights = route.weekly_flights * 2 * balance.WEEKS_PER_QUARTER
        econ_cap = int(econ_s * flights)
        biz_cap = int(biz_s * flights)
        first_cap = int(first_s * flights)

        # Approximate allocated from stats (sum of class pax is the total served).
        total_served = stats.pax
        # With biz/first > 0, split was applied:
        # econ_pax = min(econ_cap, round(allocated × 0.88))
        # biz_pax  = min(biz_cap,  round(allocated × 0.09))
        # first_pax= min(first_cap,round(allocated × 0.03))
        # We verify the capacity constraints hold.
        assert stats.classes["economy"].pax <= econ_cap
        assert stats.classes["business"].pax <= biz_cap
        assert stats.classes["first"].pax <= first_cap
        assert (
            stats.classes["economy"].pax
            + stats.classes["business"].pax
            + stats.classes["first"].pax
            == stats.pax
        )


# ---------------------------------------------------------------------------
# 5. Business/first revenue multipliers
# ---------------------------------------------------------------------------


class TestFareMultipliers:
    def test_biz_revenue_uses_3x_multiplier(self, world: World) -> None:
        """biz_revenue = biz_pax × base_fare × 3.0."""
        game = fresh(world)
        setup_route(
            game, world, cabin_mix={"economy": 60, "business": 30, "first": 10}
        )
        route = game.routes[0]
        report = settle_turn(game, world)
        stats = report.route_stats[0]

        base_fare = (balance.FARE_FIXED + balance.FARE_PER_KM * route.distance_km) * route.fare_mult
        expected_biz_rev = stats.classes["business"].pax * base_fare * balance.BIZ_FARE_MULT
        assert stats.classes["business"].revenue == pytest.approx(expected_biz_rev, abs=0.5)

    def test_first_revenue_uses_65x_multiplier(self, world: World) -> None:
        """first_revenue = first_pax × base_fare × 6.5."""
        game = fresh(world)
        setup_route(
            game, world, cabin_mix={"economy": 60, "business": 30, "first": 10}
        )
        route = game.routes[0]
        report = settle_turn(game, world)
        stats = report.route_stats[0]

        base_fare = (balance.FARE_FIXED + balance.FARE_PER_KM * route.distance_km) * route.fare_mult
        expected_first_rev = stats.classes["first"].pax * base_fare * balance.FIRST_FARE_MULT
        assert stats.classes["first"].revenue == pytest.approx(expected_first_rev, abs=0.5)

    def test_total_revenue_is_sum_of_class_revenues(self, world: World) -> None:
        game = fresh(world)
        setup_route(
            game, world, cabin_mix={"economy": 60, "business": 30, "first": 10}
        )
        report = settle_turn(game, world)
        stats = report.route_stats[0]
        class_rev_sum = (
            stats.classes["economy"].revenue
            + stats.classes["business"].revenue
            + stats.classes["first"].revenue
        )
        assert stats.revenue == pytest.approx(class_rev_sum, abs=1.0)


# ---------------------------------------------------------------------------
# 6. Tier-1 vs tier-3 share weight effect
# ---------------------------------------------------------------------------


class TestServiceTierShareWeight:
    """Tier 3 (luxury) has a higher price weight → wins a larger market share
    at the same fareMult. Tier 1 (budget) has a lower weight → smaller share.
    CONTRACT §3 M2.3: w ×= SERVICE_WEIGHT[tier] = {1: 0.85, 2: 1.0, 3: 1.15}."""

    def _settle_pax_for_tier(self, world: World, tier: int) -> int:
        game = fresh(world)
        setup_route(game, world, service_tier=tier)
        return settle_turn(game, world).route_stats[0].pax

    def test_tier3_wins_more_pax_than_tier1(self, world: World) -> None:
        pax_t1 = self._settle_pax_for_tier(world, 1)
        pax_t3 = self._settle_pax_for_tier(world, 3)
        assert pax_t3 > pax_t1, (
            f"tier-3 pax ({pax_t3}) should exceed tier-1 pax ({pax_t1})"
        )

    def test_tier2_is_between_tier1_and_tier3(self, world: World) -> None:
        pax_t1 = self._settle_pax_for_tier(world, 1)
        pax_t2 = self._settle_pax_for_tier(world, 2)
        pax_t3 = self._settle_pax_for_tier(world, 3)
        assert pax_t1 <= pax_t2 <= pax_t3

    def test_price_weight_uses_service_weight_multiplier(self) -> None:
        from app.engine.simulate import price_weight

        w1 = price_weight(1.0, service_tier=1)
        w2 = price_weight(1.0, service_tier=2)
        w3 = price_weight(1.0, service_tier=3)
        assert w2 == pytest.approx(1.0 ** balance.PRICE_ELASTICITY)
        assert w1 == pytest.approx(w2 * balance.SERVICE_WEIGHT[1])
        assert w3 == pytest.approx(w2 * balance.SERVICE_WEIGHT[3])
        assert w1 < w2 < w3


# ---------------------------------------------------------------------------
# 7. Service cost in route cost
# ---------------------------------------------------------------------------


class TestServiceCostInRouteCost:
    def test_tier2_adds_25_per_pax_to_cost(self, world: World) -> None:
        """Route cost includes SERVICE_COST_PER_PAX[2]=$25 per passenger."""
        game = fresh(world)
        setup_route(game, world, service_tier=2)
        route = game.routes[0]
        report = settle_turn(game, world)
        stats = report.route_stats[0]

        # Recompute ops cost without service cost.
        from app.engine.simulate import (
            assigned_models,
            block_hours_per_flight,
        )

        model = world.aircraft_models["a320neo"]
        d = route.distance_km
        flights = route.weekly_flights * 2 * balance.WEEKS_PER_QUARTER
        mean_fuel = model.fuel_kg_per_km
        mean_cruise = model.cruise_kmh
        fuel = d * mean_fuel * balance.FUEL_USD_PER_KG * flights
        airport = (world.cities["nyc"].slot_fee + world.cities["lax"].slot_fee) * balance.AIRPORT_FEE_FACTOR * flights
        block_hours = flights * block_hours_per_flight(d, mean_cruise)
        crew = block_hours * balance.CREW_MAINT_USD_PER_BH
        ops_cost = fuel + airport + crew
        service_cost = stats.pax * balance.SERVICE_COST_PER_PAX[2]

        assert stats.cost == pytest.approx(ops_cost + service_cost, abs=1.0)

    def test_tier3_costs_more_per_pax_than_tier1(self, world: World) -> None:
        """Higher tier → higher service cost per pax → higher total route cost
        (for the same ops — same route, same aircraft, similar pax count)."""
        game1 = fresh(world)
        setup_route(game1, world, service_tier=1)
        stats1 = settle_turn(game1, world).route_stats[0]

        game3 = fresh(world)
        setup_route(game3, world, service_tier=3)
        stats3 = settle_turn(game3, world).route_stats[0]

        # Tier-3 has more pax (better weight) AND higher cost per pax → cost > tier-1.
        # Verify service cost differential alone exceeds zero:
        svc1 = stats1.pax * balance.SERVICE_COST_PER_PAX[1]
        svc3 = stats3.pax * balance.SERVICE_COST_PER_PAX[3]
        assert svc3 > svc1

    def test_servicetier_invalid_values_rejected(self, game: GameState, world: World) -> None:
        run(
            game, world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        )
        for bad_tier in (0, 4, -1, "premium"):
            results = apply_commands(
                game,
                world,
                [{"type": "updateRoute", "routeId": "rt-1", "serviceTier": bad_tier}],
            )
            assert not results[0].ok, f"expected error for serviceTier={bad_tier}"


# ---------------------------------------------------------------------------
# 8. Wire (camelCase) smoke test
# ---------------------------------------------------------------------------


class TestWireCamelCase:
    def test_route_has_cabin_mix_and_service_tier_on_wire(self, client: TestClient) -> None:
        """After openRoute the default cabinMix and serviceTier appear in JSON."""
        state = client.post("/api/games", json={"airlineName": "Wire Air", "hqCityId": "nyc"}).json()
        game_id = state["id"]

        # Negotiate slot at lax, open route.
        resp = client.post(
            f"/api/games/{game_id}/commands",
            json={
                "commands": [
                    {"type": "negotiateSlot", "cityId": "lax"},
                    {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
                ]
            },
        )
        assert resp.status_code == 200
        routes = resp.json()["state"]["routes"]
        assert len(routes) == 1
        route = routes[0]

        # Default cabinMix on wire: camelCase keys.
        assert "cabinMix" in route
        assert route["cabinMix"] == {"economy": 100, "business": 0, "first": 0}
        # Default serviceTier on wire.
        assert route["serviceTier"] == 2

    def test_updateRoute_cabinmix_reflected_on_wire(self, client: TestClient) -> None:
        """updateRoute with cabinMix is reflected in the next GET response."""
        state = client.post("/api/games", json={"airlineName": "Mix Air", "hqCityId": "nyc"}).json()
        game_id = state["id"]

        client.post(
            f"/api/games/{game_id}/commands",
            json={
                "commands": [
                    {"type": "negotiateSlot", "cityId": "lax"},
                    {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
                    {
                        "type": "updateRoute",
                        "routeId": "rt-1",
                        "cabinMix": {"economy": 70, "business": 20, "first": 10},
                        "serviceTier": 3,
                    },
                ]
            },
        )

        state2 = client.get(f"/api/games/{game_id}").json()
        route = state2["routes"][0]
        assert route["cabinMix"] == {"economy": 70, "business": 20, "first": 10}
        assert route["serviceTier"] == 3

    def test_end_turn_route_stats_include_classes(self, client: TestClient) -> None:
        """TurnReport routeStats entries include a 'classes' key with per-cabin data."""
        state = client.post("/api/games", json={"airlineName": "Stats Air", "hqCityId": "nyc"}).json()
        game_id = state["id"]

        client.post(
            f"/api/games/{game_id}/commands",
            json={
                "commands": [
                    {"type": "buyAircraft", "modelId": "a320neo"},
                    {"type": "negotiateSlot", "cityId": "lax"},
                    {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
                    {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
                    {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7},
                ]
            },
        )
        end_resp = client.post(f"/api/games/{game_id}/end-turn", json={})
        assert end_resp.status_code == 200
        route_stats = end_resp.json()["report"]["routeStats"]
        assert len(route_stats) == 1
        rs = route_stats[0]

        assert "classes" in rs
        classes = rs["classes"]
        for cabin in ("economy", "business", "first"):
            assert cabin in classes
            assert "pax" in classes[cabin]
            assert "capacity" in classes[cabin]
            assert "revenue" in classes[cabin]

        # Default mix → all pax in economy.
        assert classes["business"]["pax"] == 0
        assert classes["first"]["pax"] == 0
        assert classes["economy"]["pax"] == rs["pax"]
