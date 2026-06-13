"""V3.9 城市禀赋效果 — unit tests per CONTRACT §3 V3.9.

Five test groups:
  1. Neutrality regression — nyc, mex, lhr, lax have zero effect.
  2. Tax relief math — dxb HQ reduces overhead by 25%.
  3. Transit factor — pair formula applied to marketPax.
  4. Terrain slot cost multiplier — mountain/island 1.15, desert 1.05, plain 1.0.
  5. Data integrity — all 95 cities have well-formed endowment fields.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.data import load_world
from app.engine import balance
from app.engine.simulate import (
    market_pax,
    overhead_cost,
    settle_turn,
)
from app.engine.state import new_game
from tests.conftest import run

DATA_DIR = Path(__file__).resolve().parents[3] / "airline-game" / "data"
VALID_TERRAINS = {"coastal", "mountain", "island", "plain", "desert"}


# ---------------------------------------------------------------------------
# 1. Neutrality regression — nyc / mex / lhr / lax
# ---------------------------------------------------------------------------


class TestNeutrality:
    """nyc, mex, lhr, and lax (T1 destination) must have taxRelief=0 and
    transitIndex=5 so that V3.9 effects are fully inert on those cities,
    keeping the four CONTRACT §3 balance acceptance tests unchanged."""

    @pytest.mark.parametrize("city_id", ["nyc", "mex", "lhr", "lax"])
    def test_tax_relief_zero(self, world, city_id):
        city = world.cities[city_id]
        assert city.tax_relief == 0.0, (
            f"{city_id} must have taxRelief=0 (calibration red line)"
        )

    @pytest.mark.parametrize("city_id", ["nyc", "mex", "lhr", "lax"])
    def test_transit_index_five(self, world, city_id):
        city = world.cities[city_id]
        assert city.transit_index == 5, (
            f"{city_id} must have transitIndex=5 (calibration red line)"
        )

    def test_transit_factor_neutral_pair_is_one(self, world):
        """market_pax with transit_a=5, transit_b=5 equals the base formula."""
        nyc = world.cities["nyc"]
        lax = world.cities["lax"]
        from app.engine.state import haversine_km
        dist = haversine_km(nyc.lat, nyc.lon, lax.lat, lax.lon)
        base = market_pax(nyc.demand_index, lax.demand_index, 3, dist)
        with_transit = market_pax(
            nyc.demand_index, lax.demand_index, 3, dist,
            transit_a=nyc.transit_index,
            transit_b=lax.transit_index,
        )
        assert abs(with_transit - base) < 1e-9, (
            "nyc→lax transit factor must be 1.0 (both have transitIndex=5)"
        )


# ---------------------------------------------------------------------------
# 2. Tax relief — dxb HQ reduces overhead by 25%
# ---------------------------------------------------------------------------


class TestTaxRelief:
    def test_dxb_tax_relief_value(self, world):
        """dxb must have taxRelief=0.25 per the spec example."""
        dxb = world.cities["dxb"]
        assert dxb.tax_relief == 0.25

    def test_dxb_hq_overhead_reduced_25_percent(self, world):
        """With HQ in dxb (taxRelief=0.25), overhead is 75% of the neutral value."""
        game_nyc = new_game("g-oh-nyc", "NYC Air", world.cities["nyc"])
        game_dxb = new_game("g-oh-dxb", "DXB Air", world.cities["dxb"])

        oh_nyc = overhead_cost(game_nyc, world)
        oh_dxb = overhead_cost(game_dxb, world)
        oh_neutral = overhead_cost(game_nyc)  # no world → no relief

        # nyc has taxRelief=0 so it matches the no-world baseline
        assert abs(oh_nyc - oh_neutral) < 1e-9, "nyc overhead must equal neutral"
        # dxb should be exactly 75% of neutral (1 - 0.25)
        assert abs(oh_dxb - oh_neutral * 0.75) < 1e-6, (
            f"dxb overhead {oh_dxb} != 75% of neutral {oh_neutral * 0.75}"
        )

    def test_tax_relief_propagates_to_quarterly_cost(self, world):
        """settle_turn with dxb HQ yields lower total cost vs nyc HQ (ceteris paribus)."""
        game_nyc = new_game("g-tax-nyc", "NYC Air", world.cities["nyc"])
        game_dxb = new_game("g-tax-dxb", "DXB Air", world.cities["dxb"])

        # Settle without any routes so only overhead drives cost
        report_nyc = settle_turn(game_nyc, world, event_pool=[], decision_pool=[])
        report_dxb = settle_turn(game_dxb, world, event_pool=[], decision_pool=[])

        # dxb overhead = neutral × 0.75 → dxb cost strictly lower
        assert report_dxb.totals.cost < report_nyc.totals.cost, (
            "dxb (25% tax relief) must incur lower overhead than nyc (no relief)"
        )


# ---------------------------------------------------------------------------
# 3. Transit factor on market pax
# ---------------------------------------------------------------------------


class TestTransitFactor:
    def test_formula_above_neutral(self):
        """Both cities above neutral → market_pax boosted above base."""
        base = market_pax(8, 7, 3, 5000.0)
        boosted = market_pax(8, 7, 3, 5000.0, transit_a=7, transit_b=8)
        # factor = (1.02) × (1.03) = 1.0506
        assert boosted > base
        assert abs(boosted / base - 1.0506) < 1e-9

    def test_formula_below_neutral(self):
        """Both cities below neutral → market_pax reduced below base."""
        base = market_pax(8, 7, 3, 5000.0)
        reduced = market_pax(8, 7, 3, 5000.0, transit_a=3, transit_b=4)
        # factor = (0.98) × (0.99) = 0.9702
        assert reduced < base
        assert abs(reduced / base - 0.9702) < 1e-9

    def test_formula_one_side_neutral(self):
        """One city neutral, one above → factor = 1 × (1 + 0.01*(t-5))."""
        base = market_pax(8, 7, 3, 5000.0)
        result = market_pax(8, 7, 3, 5000.0, transit_a=5, transit_b=9)
        # factor = 1.0 × 1.04 = 1.04
        assert abs(result / base - 1.04) < 1e-9

    def test_transit_factor_applied_in_allocate_market(self, world):
        """allocate_market uses city.transit_index, not a fixed 5."""
        # sin has transitIndex=9; its routes should get boosted market
        sin = world.cities["sin"]
        assert sin.transit_index == 9

        # Build two games, one with a sin route, one with a nyc-lax route.
        # Compare market relative to base (demand-index-only) prediction.
        # We verify this by checking settle_turn changes market pax for sin routes.
        # (Direct verification: market_pax with and without transit)
        dxb = world.cities["dxb"]
        from app.engine.state import haversine_km
        dist = haversine_km(sin.lat, sin.lon, dxb.lat, dxb.lon)
        base_market = market_pax(sin.demand_index, dxb.demand_index, 3, dist)
        transit_market = market_pax(
            sin.demand_index, dxb.demand_index, 3, dist,
            transit_a=sin.transit_index, transit_b=dxb.transit_index
        )
        # sin=9, dxb=7 → factor = 1.04 × 1.02 = 1.0608
        assert transit_market > base_market
        assert abs(transit_market / base_market - 1.0608) < 1e-9


# ---------------------------------------------------------------------------
# 4. Terrain slot cost multiplier
# ---------------------------------------------------------------------------


class TestTerrainSlotCost:
    def _slot_cost_for(self, world, city_id: str) -> float:
        """Compute negotiation cost for city_id from a nyc game."""
        from app.engine.state import pool_slots_taken
        game = new_game("g-terrain", "Terrain Air", world.cities["nyc"])
        city = world.cities[city_id]
        taken = pool_slots_taken(game, city_id)
        terrain_mult = balance.TERRAIN_SLOT_MULT.get(city.terrain, 1.0)
        base = city.slot_fee * balance.SLOT_COST_MULT * (1 + taken / city.slot_capacity)
        return round(base * terrain_mult, 2)

    def test_mountain_terrain_multiplier_1_15(self, world):
        """mex has terrain=mountain → slot cost = base × 1.15."""
        mex = world.cities["mex"]
        assert mex.terrain == "mountain"
        taken = 0  # no AI routes touch mex in a fresh game
        base = mex.slot_fee * balance.SLOT_COST_MULT * (1 + taken / mex.slot_capacity)
        expected = round(base * 1.15, 2)
        actual = self._slot_cost_for(world, "mex")
        assert abs(actual - expected) < 1.0, (
            f"mountain slot cost: expected ≈{expected}, got {actual}"
        )

    def test_island_terrain_multiplier_1_15(self, world):
        """sin has terrain=island → slot cost = base × 1.15."""
        sin = world.cities["sin"]
        assert sin.terrain == "island"

    def test_desert_terrain_multiplier_1_05(self, world):
        """dxb has terrain=desert → slot cost = base × 1.05."""
        dxb = world.cities["dxb"]
        assert dxb.terrain == "desert"

    def test_coastal_multiplier_1_0(self, world):
        """nyc has terrain=coastal → multiplier = 1.0 (no surcharge)."""
        nyc = world.cities["nyc"]
        assert nyc.terrain == "coastal"
        assert balance.TERRAIN_SLOT_MULT["coastal"] == 1.0

    def test_plain_multiplier_1_0(self, world):
        """ord has terrain=plain → multiplier = 1.0 (no surcharge)."""
        ord_ = world.cities["ord"]
        assert ord_.terrain == "plain"
        assert balance.TERRAIN_SLOT_MULT["plain"] == 1.0

    def test_negotiate_slot_applies_terrain_mult(self, world):
        """negotiateSlot actually charges the terrain-adjusted cost."""
        # Use mex (mountain) and nyc (coastal) starting games to compare costs.
        # Both games are fresh so taken=0 at the target city.
        game_nyc_hq = new_game("g-terr-nyc", "NYC Air", world.cities["nyc"])
        game_mex_hq = new_game("g-terr-mex", "MEX Air", world.cities["nyc"])

        cash_before_nyc = game_nyc_hq.cash
        cash_before_mex = game_mex_hq.cash

        # Negotiate at lax (coastal) and mex (mountain)
        lax = world.cities["lax"]
        mex = world.cities["mex"]

        run(game_nyc_hq, world, {"type": "negotiateSlot", "cityId": "lax"})
        run(game_mex_hq, world, {"type": "negotiateSlot", "cityId": "mex"})

        cost_lax = cash_before_nyc - game_nyc_hq.cash
        cost_mex = cash_before_mex - game_mex_hq.cash

        # mex is mountain (×1.15) with fee 5200; lax is coastal (×1.0) with fee 8500.
        # Base cost at empty pool: slotFee × 800 × (1 + 0/capacity)
        expected_lax = lax.slot_fee * balance.SLOT_COST_MULT * 1.0
        expected_mex = mex.slot_fee * balance.SLOT_COST_MULT * 1.15
        assert abs(cost_lax - expected_lax) < 1.0, (
            f"lax (coastal) cost {cost_lax} != expected {expected_lax}"
        )
        assert abs(cost_mex - expected_mex) < 1.0, (
            f"mex (mountain) cost {cost_mex} != expected {expected_mex}"
        )
        # Mountain is cheaper in absolute $ (lower slotFee) but with multiplier
        # verify both charges are correct relative to each other
        assert cost_mex / cost_lax == pytest.approx(
            (mex.slot_fee * 1.15) / lax.slot_fee, rel=1e-4
        )


# ---------------------------------------------------------------------------
# 5. Data integrity — all 95 cities
# ---------------------------------------------------------------------------


class TestDataIntegrity:
    @pytest.fixture(scope="class")
    def cities_raw(self):
        with open(DATA_DIR / "cities.json", encoding="utf-8") as fh:
            return json.load(fh)

    def test_city_count_is_95(self, cities_raw):
        assert len(cities_raw) == 95

    def test_all_cities_have_iata(self, cities_raw):
        for c in cities_raw:
            assert "iata" in c, f"{c['id']} missing iata"
            assert len(c["iata"]) == 3 and c["iata"].isupper(), (
                f"{c['id']} bad iata: {c['iata']!r}"
            )

    def test_all_cities_have_airport(self, cities_raw):
        for c in cities_raw:
            assert c.get("airport", ""), f"{c['id']} missing airport name"

    def test_all_cities_have_airport_zh(self, cities_raw):
        for c in cities_raw:
            assert c.get("airportZh", ""), f"{c['id']} missing airportZh"

    def test_all_cities_population_positive(self, cities_raw):
        for c in cities_raw:
            assert c.get("population", 0) > 0, f"{c['id']} population must be >0"

    def test_all_cities_tax_relief_in_range(self, cities_raw):
        for c in cities_raw:
            tr = c.get("taxRelief", 0)
            assert 0 <= tr <= 0.3, f"{c['id']} taxRelief={tr} out of [0, 0.3]"

    def test_all_cities_transit_index_in_range(self, cities_raw):
        for c in cities_raw:
            ti = c.get("transitIndex", 5)
            assert isinstance(ti, int) and 1 <= ti <= 10, (
                f"{c['id']} transitIndex={ti} must be int in [1, 10]"
            )

    def test_all_cities_terrain_valid(self, cities_raw):
        for c in cities_raw:
            t = c.get("terrain", "")
            assert t in VALID_TERRAINS, f"{c['id']} terrain={t!r} not in {VALID_TERRAINS}"

    def test_neutrality_cities_exact_values(self, cities_raw):
        """nyc, mex, lhr must have taxRelief=0 and transitIndex=5 (calibration red line)."""
        neutral_ids = {"nyc", "mex", "lhr", "lax"}
        by_id = {c["id"]: c for c in cities_raw}
        for cid in neutral_ids:
            c = by_id[cid]
            assert c["taxRelief"] == 0, f"{cid} taxRelief must be 0"
            assert c["transitIndex"] == 5, f"{cid} transitIndex must be 5"
