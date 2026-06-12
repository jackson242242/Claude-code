"""The four balance acceptance targets of CONTRACT §3.

Frequency wording: "每周 N 班" is the route's total weekly movements (both
directions combined), i.e. ``weeklyFlights = N / 2`` per direction — the only
reading compatible with the contract's own 84 block-hour utilization cap for
the single-aircraft scenarios below.
"""
from __future__ import annotations

import pytest

from app.engine import balance
from app.engine.simulate import settle_turn
from app.engine.state import haversine_km, new_game

from tests.conftest import run


def open_and_fly(game, world, model_id, city_b, weekly_flights, fare_mult=1.0):
    run(
        game,
        world,
        {"type": "buyAircraft", "modelId": model_id},
        {"type": "openRoute", "cityA": "nyc", "cityB": city_b},
        {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
        {
            "type": "updateRoute",
            "routeId": "rt-1",
            "weeklyFlights": weekly_flights,
            "fareMult": fare_mult,
        },
    )
    return settle_turn(game, world).route_stats[0]


def fresh(world, name="Balance Air"):
    return new_game("g-balance", name, world.cities["nyc"])


class TestBalanceTargets:
    def test_target_1_a320neo_domestic_trunk(self, world):
        """1 owned A320neo, HQ NYC ↔ demandIndex≥7 city at ~2,000–4,000 km,
        14 weekly movements, fareMult 1.0 → load factor 70–90%, route profit > 0."""
        nyc = world.cities["nyc"]
        lax = world.cities["lax"]
        distance = haversine_km(nyc.lat, nyc.lon, lax.lat, lax.lon)
        assert lax.demand_index >= 7
        assert 2000 <= distance <= 4000

        stats = open_and_fly(fresh(world), world, "a320neo", "lax", weekly_flights=7)
        assert 0.70 <= stats.load_factor <= 0.90
        assert stats.profit > 0

    def test_target_2_787_transatlantic(self, world):
        """1 owned 787-9 on NYC↔London, 7 weekly movements → load factor ≥ 75%
        and still profitable after holding cost."""
        stats = open_and_fly(fresh(world), world, "b787-9", "lhr", weekly_flights=3.5)
        assert stats.load_factor >= 0.75
        holding = world.aircraft_models["b787-9"].price * balance.DEPRECIATION_Q
        assert stats.profit - holding > 0

    def test_target_3_price_elasticity(self, world):
        """fareMult 1.6 cuts traffic sharply; fareMult 0.6 fills the plane but
        earns less profit than fareMult 1.0."""
        base = open_and_fly(fresh(world), world, "a320neo", "lax", 7, fare_mult=1.0)
        pricey = open_and_fly(fresh(world), world, "a320neo", "lax", 7, fare_mult=1.6)
        cheap = open_and_fly(fresh(world), world, "a320neo", "lax", 7, fare_mult=0.6)

        # Elasticity bites: 1.6 ** -1.6 ≈ 0.47 of base demand.
        assert pricey.pax < 0.6 * base.pax
        # Discounting fills every seat...
        assert cheap.pax == cheap.capacity
        assert cheap.load_factor == 1.0
        # ...but earns less than fareMult 1.0.
        assert cheap.profit < base.profit

    def test_target_4_three_a320neo_leave_80m(self, world):
        """Buying 3 A320neo outright still leaves > $80M of the $420M start."""
        game = fresh(world)
        run(
            game,
            world,
            *[{"type": "buyAircraft", "modelId": "a320neo"}] * 3,
        )
        assert len(game.fleet) == 3
        assert game.cash > 80_000_000
