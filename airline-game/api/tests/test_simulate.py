"""Turn settlement: every number in the report must be recomputable from the
CONTRACT §3 formulas and the balance constants."""
from __future__ import annotations

import math

import pytest

from app.engine import balance
from app.engine.simulate import settle_turn
from app.engine.state import GameOverError

from tests.conftest import run


def setup_reference_game(game, world):
    """1 owned A320neo on NYC–LAX, 7 weekly flights per direction, fareMult 1."""
    run(
        game,
        world,
        {"type": "buyAircraft", "modelId": "a320neo"},
        {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
        {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": 1.0},
    )
    return game


def expected_route_numbers(world, route, quarter, model_id="a320neo"):
    """Recompute one route-quarter by hand, straight from CONTRACT §3 (M2.1
    share competition model; the NYC pairs used here have no AI sellers, so
    the only rivals are the background market at weight W_BG)."""
    model = world.aircraft_models[model_id]
    city_a, city_b = world.cities[route.city_a], world.cities[route.city_b]
    d = route.distance_km
    flights = route.weekly_flights * 2 * 13

    capacity = model.seats * route.weekly_flights * 2 * 13
    market = (
        balance.BASE_K
        * city_a.demand_index
        * city_b.demand_index
        * balance.SEASON_FACTOR[quarter]
        * math.exp(-d / 9000)
    )
    weight = route.fare_mult ** balance.PRICE_ELASTICITY
    share = weight / (weight + balance.W_BG)
    pax = round(min(capacity, market * weight * share))
    fare = (balance.FARE_FIXED + balance.FARE_PER_KM * d) * route.fare_mult
    revenue = pax * fare

    fuel = d * model.fuel_kg_per_km * balance.FUEL_USD_PER_KG * flights
    airport = (city_a.slot_fee + city_b.slot_fee) * flights
    block_hours = flights * (d / model.cruise_kmh + 0.6)
    crew = block_hours * balance.CREW_MAINT_USD_PER_BH
    cost = fuel + airport + crew
    return pax, capacity, revenue, cost


class TestSettlementNumbers:
    def test_route_stats_recomputable(self, game, world):
        setup_reference_game(game, world)
        route = game.routes[0]
        report = settle_turn(game, world)

        pax, capacity, revenue, cost = expected_route_numbers(world, route, 3)
        stats = report.route_stats[0]
        assert stats.route_id == "rt-1"
        assert stats.pax == pax
        assert stats.capacity == capacity
        assert stats.load_factor == pytest.approx(pax / capacity, abs=1e-4)
        assert stats.revenue == pytest.approx(revenue, abs=0.5)
        assert stats.cost == pytest.approx(cost, abs=0.5)
        assert stats.profit == pytest.approx(revenue - cost, abs=1.0)
        assert route.last_quarter is not None
        assert route.last_quarter.pax == pax

    def test_totals_include_holding_and_overhead(self, game, world):
        setup_reference_game(game, world)
        report = settle_turn(game, world)

        price = world.aircraft_models["a320neo"].price
        holding = price * balance.DEPRECIATION_Q
        overhead = balance.HQ_OVERHEAD + balance.ADMIN_PER_AIRCRAFT * 1
        route_stats = report.route_stats[0]
        assert report.totals.revenue == pytest.approx(route_stats.revenue)
        assert report.totals.cost == pytest.approx(route_stats.cost + holding + overhead)
        assert report.totals.profit == pytest.approx(
            report.totals.revenue - report.totals.cost
        )

    def test_cash_and_finance_updated(self, game, world):
        setup_reference_game(game, world)
        cash_before = game.cash
        report = settle_turn(game, world)
        assert game.cash == pytest.approx(cash_before + report.totals.profit)
        assert game.finance.last_quarter.profit == report.totals.profit
        assert len(game.finance.history) == 1
        entry = game.finance.history[0]
        assert (entry.turn, entry.cash, entry.profit) == (1, game.cash, report.totals.profit)
        assert any("结算" in item.headline for item in game.news)

    def test_idle_fleet_still_pays_holding_costs(self, game, world):
        run(
            game,
            world,
            {"type": "buyAircraft", "modelId": "a320neo"},
            {"type": "leaseAircraft", "modelId": "b787-9"},
        )
        report = settle_turn(game, world)
        price_a320 = world.aircraft_models["a320neo"].price
        price_787 = world.aircraft_models["b787-9"].price
        expected_cost = (
            price_a320 * balance.DEPRECIATION_Q
            + price_787 * balance.LEASE_RATE_Q
            + balance.HQ_OVERHEAD
            + balance.ADMIN_PER_AIRCRAFT * 2
        )
        assert report.totals.revenue == 0
        assert report.totals.cost == pytest.approx(expected_cost)

    def test_unassigned_route_flies_nothing(self, game, world):
        run(game, world, {"type": "openRoute", "cityA": "nyc", "cityB": "lax"})
        report = settle_turn(game, world)
        stats = report.route_stats[0]
        assert (stats.pax, stats.capacity, stats.revenue, stats.cost) == (0, 0, 0.0, 0.0)


class TestCalendar:
    def test_quarters_advance_from_2026_q3(self, game, world):
        assert (game.turn, game.year, game.quarter) == (1, 2026, 3)
        report = settle_turn(game, world)
        assert (report.turn, report.year, report.quarter) == (1, 2026, 3)
        assert (game.turn, game.year, game.quarter) == (2, 2026, 4)
        settle_turn(game, world)
        assert (game.turn, game.year, game.quarter) == (3, 2027, 1)
        settle_turn(game, world)
        assert (game.turn, game.year, game.quarter) == (4, 2027, 2)

    def test_season_factor_applied_per_quarter(self, game, world):
        """Same setup, Q3 (1.15) vs Q4 (0.95): pax scales with the season."""
        setup_reference_game(game, world)
        q3 = settle_turn(game, world).route_stats[0]
        q4 = settle_turn(game, world).route_stats[0]
        assert q4.pax == pytest.approx(q3.pax * 0.95 / 1.15, rel=0.01)


class TestBankruptcy:
    def test_two_consecutive_negative_quarters(self, game, world):
        game.cash = 100.0  # overheads alone push the balance negative
        settle_turn(game, world)
        assert game.cash < 0
        assert game.status == "active"
        assert any("警报" in item.headline for item in game.news)

        settle_turn(game, world)
        assert game.status == "bankrupt"
        assert any("破产" in item.headline for item in game.news)

        with pytest.raises(GameOverError):
            settle_turn(game, world)

    def test_recovery_resets_the_streak(self, game, world):
        game.cash = 100.0
        settle_turn(game, world)
        assert game.cash < 0 and game.status == "active"
        game.cash = 50_000_000.0  # bailout: one positive quarter end resets
        settle_turn(game, world)
        assert game.status == "active"
        game.cash = 100.0
        settle_turn(game, world)
        assert game.cash < 0 and game.status == "active"  # streak restarted at 1
