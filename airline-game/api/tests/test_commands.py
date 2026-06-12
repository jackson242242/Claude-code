"""Command validation per CONTRACT §2/§3: invalid city, range too short,
insufficient cash, utilization cap, plus the remaining rules."""
from __future__ import annotations

import pytest

from app.engine import balance
from app.engine.commands import apply_commands
from app.engine.state import GameOverError, get_route

from tests.conftest import run


def first(state, world, command: dict):
    return apply_commands(state, world, [command])[0]


class TestOpenRoute:
    def test_invalid_city_rejected(self, game, world):
        result = first(game, world, {"type": "openRoute", "cityA": "nyc", "cityB": "zzz"})  # zzz: not in cities.json
        assert not result.ok
        assert "unknown city" in result.message
        assert game.routes == []

    def test_same_city_rejected(self, game, world):
        result = first(game, world, {"type": "openRoute", "cityA": "nyc", "cityB": "nyc"})
        assert not result.ok

    def test_non_hq_route_rejected(self, game, world):
        result = first(game, world, {"type": "openRoute", "cityA": "lax", "cityB": "lhr"})
        assert not result.ok
        assert "HQ" in result.message

    def test_duplicate_route_rejected_either_direction(self, game, world):
        run(
            game,
            world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        )
        for a, b in (("nyc", "lax"), ("lax", "nyc")):
            result = first(game, world, {"type": "openRoute", "cityA": a, "cityB": b})
            assert not result.ok
            assert "already exists" in result.message

    def test_open_route_computes_haversine_distance(self, game, world):
        run(
            game,
            world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        )
        route = game.routes[0]
        assert route.id == "rt-1"
        assert route.distance_km == pytest.approx(3974, abs=15)
        assert route.weekly_flights == balance.DEFAULT_WEEKLY_FLIGHTS
        assert route.fare_mult == 1.0
        assert route.last_quarter is None


class TestFleetCommands:
    def test_buy_deducts_price(self, game, world):
        run(game, world, {"type": "buyAircraft", "modelId": "a320neo"})
        assert game.cash == balance.STARTING_CASH - world.aircraft_models["a320neo"].price
        assert game.fleet[0].id == "ac-1"
        assert game.fleet[0].ownership == "owned"

    def test_buy_unknown_model_rejected(self, game, world):
        result = first(game, world, {"type": "buyAircraft", "modelId": "concorde"})
        assert not result.ok
        assert "unknown aircraft model" in result.message

    def test_insufficient_cash_rejected(self, game, world):
        # 777-9 costs $442M > $420M starting cash.
        result = first(game, world, {"type": "buyAircraft", "modelId": "b777-9"})
        assert not result.ok
        assert "insufficient cash" in result.message
        assert game.fleet == []
        assert game.cash == balance.STARTING_CASH

    def test_sell_refunds_seventy_percent(self, game, world):
        run(game, world, {"type": "buyAircraft", "modelId": "a320neo"})
        run(game, world, {"type": "sellAircraft", "aircraftId": "ac-1"})
        price = world.aircraft_models["a320neo"].price
        assert game.cash == pytest.approx(balance.STARTING_CASH - price + price * 0.7)
        assert game.fleet == []

    def test_sell_leased_rejected_and_return_lease_works(self, game, world):
        run(game, world, {"type": "leaseAircraft", "modelId": "a320neo"})
        assert game.cash == balance.STARTING_CASH  # no upfront cost for leases
        result = first(game, world, {"type": "sellAircraft", "aircraftId": "ac-1"})
        assert not result.ok
        run(game, world, {"type": "returnLease", "aircraftId": "ac-1"})
        assert game.fleet == []

    def test_sell_unassigns_from_route(self, game, world):
        run(
            game,
            world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "sellAircraft", "aircraftId": "ac-1"},
        )
        assert game.routes[0].aircraft_ids == []


class TestAssignAircraft:
    def test_range_too_short_rejected(self, game, world):
        # E195-E2 range 4,815 km < NYC–Tokyo (~10,850 km).
        run(
            game,
            world,
            {"type": "buyAircraft", "modelId": "e195-e2"},
            {"type": "negotiateSlot", "cityId": "hnd"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "hnd"},
        )
        result = first(
            game, world, {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"}
        )
        assert not result.ok
        assert "range" in result.message
        assert game.routes[0].aircraft_ids == []
        assert game.fleet[0].route_id is None

    def test_assign_and_unassign(self, game, world):
        run(
            game,
            world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
        )
        assert game.fleet[0].route_id == "rt-1"
        assert game.routes[0].aircraft_ids == ["ac-1"]
        run(game, world, {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": None})
        assert game.fleet[0].route_id is None
        assert game.routes[0].aircraft_ids == []

    def test_reassign_moves_between_routes(self, game, world):
        run(
            game,
            world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "negotiateSlot", "cityId": "mex"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "mex"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-2"},
        )
        assert get_route(game, "rt-1").aircraft_ids == []
        assert get_route(game, "rt-2").aircraft_ids == ["ac-1"]


class TestUpdateRoute:
    @pytest.fixture
    def routed_game(self, game, world):
        run(
            game,
            world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
        )
        return game

    def test_utilization_cap_enforced(self, routed_game, world):
        # NYC–LAX block time ≈ 5.37 h; one A320neo allows at most
        # 84 / (2 × 5.37) ≈ 7.8 weekly flights per direction.
        result = apply_commands(
            routed_game,
            world,
            [{"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 8}],
        )[0]
        assert not result.ok
        assert "utilization cap" in result.message
        assert routed_game.routes[0].weekly_flights == 7

    def test_utilization_cap_scales_with_fleet(self, routed_game, world):
        run(
            routed_game,
            world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "assignAircraft", "aircraftId": "ac-2", "routeId": "rt-1"},
            {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 14},
        )
        assert routed_game.routes[0].weekly_flights == 14

    def test_fare_mult_bounds(self, routed_game, world):
        for bad in (0.5, 1.7, 0):
            result = apply_commands(
                routed_game,
                world,
                [{"type": "updateRoute", "routeId": "rt-1", "fareMult": bad}],
            )[0]
            assert not result.ok, f"fareMult {bad} should be rejected"
        run(routed_game, world, {"type": "updateRoute", "routeId": "rt-1", "fareMult": 1.6})
        assert routed_game.routes[0].fare_mult == 1.6

    def test_weekly_flights_must_be_positive(self, routed_game, world):
        result = apply_commands(
            routed_game,
            world,
            [{"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": -1}],
        )[0]
        assert not result.ok


class TestBatchSemantics:
    def test_failed_command_does_not_block_the_rest(self, game, world):
        results = apply_commands(
            game,
            world,
            [
                {"type": "buyAircraft", "modelId": "b777-9"},  # too expensive
                {"type": "buyAircraft", "modelId": "a320neo"},
                {"type": "noSuchCommand"},
            ],
        )
        assert [r.ok for r in results] == [False, True, False]
        assert [r.index for r in results] == [0, 1, 2]
        assert len(game.fleet) == 1

    def test_close_route_unassigns_aircraft(self, game, world):
        run(
            game,
            world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
            {"type": "closeRoute", "routeId": "rt-1"},
        )
        assert game.routes == []
        assert game.fleet[0].route_id is None

    def test_bankrupt_game_rejects_commands(self, game, world):
        game.status = "bankrupt"
        with pytest.raises(GameOverError):
            apply_commands(game, world, [{"type": "buyAircraft", "modelId": "a320neo"}])
