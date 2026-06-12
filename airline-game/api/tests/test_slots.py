"""M2.2 airport slot system (CONTRACT §2/§3): negotiateSlot economics and
ordered failure checks, route slot occupancy at both ends, AI pool consumption
with deterministic skip-when-full, and the slotMarket snapshot (engine + wire).

Reference numbers used below (slotFee × 800 × (1 + taken/capacity)):
- lax  (fee 8,500, cap 11, taken 0):           $6,800,000.00
- lax second slot (taken 1):                   $7,418,181.82
- nyc HQ (fee 9,500, cap 12, taken 2 held):    $8,866,666.67
- hnd  (fee 9,800, cap 9, taken 2 AI ends):    $9,582,222.22
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.engine import balance
from app.engine.commands import apply_commands
from app.engine.simulate import settle_turn
from app.engine.state import compute_slot_market, new_game
from app.main import app

from tests.conftest import run


def first(state, world, command: dict):
    return apply_commands(state, world, [command])[0]


class TestNegotiateSlot:
    def test_success_deducts_exact_cost_and_increments_held(self, game, world):
        # lax: fee 8,500, capacity 11, pool empty → 8500 × 800 × (1 + 0/11).
        run(game, world, {"type": "negotiateSlot", "cityId": "lax"})
        assert game.slots_held["lax"] == 1
        assert game.cash == pytest.approx(
            balance.STARTING_CASH - 6_800_000.00, abs=0.01
        )
        assert game.last_negotiation_turn["lax"] == 1

        # nyc (the HQ): the 2 starting held slots count as taken
        # → 9500 × 800 × (1 + 2/12) = 8,866,666.67.
        run(game, world, {"type": "negotiateSlot", "cityId": "nyc"})
        assert game.slots_held["nyc"] == balance.HQ_STARTING_SLOTS + 1
        assert game.cash == pytest.approx(
            balance.STARTING_CASH - 6_800_000.00 - 8_866_666.67, abs=0.01
        )

    def test_cost_rises_with_pool_occupancy_including_ai_ends(self, game, world):
        # hnd hosts 2 Aurora route ends (hnd-pvg, hnd-sin), capacity 9
        # → 9800 × 800 × (1 + 2/9) = 9,582,222.22.
        cash_before = game.cash
        run(game, world, {"type": "negotiateSlot", "cityId": "hnd"})
        assert cash_before - game.cash == pytest.approx(9_582_222.22, abs=0.01)

    def test_cooldown_one_negotiation_per_city_per_turn(self, game, world):
        run(game, world, {"type": "negotiateSlot", "cityId": "lax"})
        result = first(game, world, {"type": "negotiateSlot", "cityId": "lax"})
        assert not result.ok
        assert "this turn" in result.message
        assert game.slots_held["lax"] == 1  # unchanged

        # Another city is fine the same turn; the same city is fine next turn.
        run(game, world, {"type": "negotiateSlot", "cityId": "mex"})
        game.turn += 1  # next quarter (without settlement noise)
        cash_before = game.cash
        run(game, world, {"type": "negotiateSlot", "cityId": "lax"})
        assert game.slots_held["lax"] == 2
        # Second lax slot: taken 1 of 11 → 6,800,000 × 12/11 = 7,418,181.82.
        assert cash_before - game.cash == pytest.approx(7_418_181.82, abs=0.01)

    def test_pool_full_rejected(self, game, world):
        syd = world.cities["syd"]
        game.slots_held["syd"] = syd.slot_capacity  # 8/8 → full
        result = first(game, world, {"type": "negotiateSlot", "cityId": "syd"})
        assert not result.ok
        assert "full" in result.message
        assert game.slots_held["syd"] == syd.slot_capacity
        assert game.cash == balance.STARTING_CASH

    def test_insufficient_cash_rejected_without_side_effects(self, game, world):
        game.cash = 1_000.0
        result = first(game, world, {"type": "negotiateSlot", "cityId": "lax"})
        assert not result.ok
        assert "insufficient cash" in result.message
        assert game.cash == 1_000.0
        assert game.slots_held.get("lax", 0) == 0
        # A failed negotiation does not burn the per-turn cooldown: with the
        # cash back, the same city succeeds in the same turn.
        game.cash = balance.STARTING_CASH
        run(game, world, {"type": "negotiateSlot", "cityId": "lax"})
        assert game.slots_held["lax"] == 1

    def test_failure_checks_are_ordered(self, game, world):
        # Cooldown is reported before pool-full…
        run(game, world, {"type": "negotiateSlot", "cityId": "syd"})
        game.slots_held["syd"] = world.cities["syd"].slot_capacity
        result = first(game, world, {"type": "negotiateSlot", "cityId": "syd"})
        assert not result.ok and "this turn" in result.message
        # …and pool-full before insufficient cash.
        game.cash = 0.0
        game.slots_held["gru"] = world.cities["gru"].slot_capacity
        result = first(game, world, {"type": "negotiateSlot", "cityId": "gru"})
        assert not result.ok and "full" in result.message

    def test_unknown_city_rejected(self, game, world):
        result = first(game, world, {"type": "negotiateSlot", "cityId": "atl"})
        assert not result.ok
        assert "unknown city" in result.message


class TestRouteSlotOccupancy:
    def test_open_route_blocked_without_destination_slot(self, game, world):
        # cityB end (the destination) holds no slot yet.
        result = first(game, world, {"type": "openRoute", "cityA": "nyc", "cityB": "lax"})
        assert not result.ok
        assert "lax" in result.message and "negotiate" in result.message.lower()
        assert game.routes == []

    def test_open_route_blocked_when_cityA_end_lacks_slot(self, game, world):
        # Same gap tested in the other position: cityA is the slot-less end.
        result = first(game, world, {"type": "openRoute", "cityA": "lax", "cityB": "nyc"})
        assert not result.ok
        assert "lax" in result.message and "negotiate" in result.message.lower()

    def test_open_route_blocked_when_hq_slots_are_exhausted(self, game, world):
        run(
            game,
            world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "negotiateSlot", "cityId": "mex"},
            {"type": "negotiateSlot", "cityId": "gru"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "mex"},
        )
        # Both HQ-held slots are now in use; gru holds a free slot but nyc not.
        result = first(game, world, {"type": "openRoute", "cityA": "nyc", "cityB": "gru"})
        assert not result.ok
        assert "nyc" in result.message and "negotiate" in result.message.lower()
        assert len(game.routes) == 2

    def test_close_route_frees_usage_but_keeps_held_slots(self, game, world):
        run(
            game,
            world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        )
        market = compute_slot_market(game, world)
        assert (market["lax"].player_held, market["lax"].player_used) == (1, 1)

        run(game, world, {"type": "closeRoute", "routeId": "rt-1"})
        market = compute_slot_market(game, world)
        assert (market["lax"].player_held, market["lax"].player_used) == (1, 0)
        assert (market["nyc"].player_held, market["nyc"].player_used) == (2, 0)

        # The held slots are reusable: reopening needs no new negotiation.
        run(game, world, {"type": "openRoute", "cityA": "nyc", "cityB": "lax"})
        assert len(game.routes) == 1


class TestSlotMarketSnapshot:
    def test_snapshot_arithmetic_across_player_and_ai(self, game, world):
        run(
            game,
            world,
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        )
        market = compute_slot_market(game, world)
        assert set(market) == set(world.cities)  # snapshot covers every city

        def as_tuple(city_id):
            info = market[city_id]
            return (info.capacity, info.taken, info.player_held, info.player_used)

        # taken = AI route ends + playerHeld (used or not).
        assert as_tuple("nyc") == (12, 2, 2, 1)  # HQ: 2 held (1 in use), no AI
        assert as_tuple("lax") == (11, 1, 1, 1)  # 1 negotiated slot, in use
        assert as_tuple("hnd") == (9, 2, 0, 0)  # Aurora hnd-pvg + hnd-sin
        assert as_tuple("sin") == (10, 2, 0, 0)  # Aurora + Falcon
        assert as_tuple("dxb") == (12, 3, 0, 0)  # Meridian + Falcon ×2
        assert as_tuple("syd") == (8, 0, 0, 0)  # untouched


class TestAIPoolConsumption:
    def test_ai_skips_full_pool_city_deterministically(self, world):
        def play():
            game = new_game("g-skip", "Skip Air", world.cities["nyc"])
            # Fill nyc's pool (capacity 12) so the AIs' top candidate is full.
            game.slots_held["nyc"] = world.cities["nyc"].slot_capacity
            for _ in range(4):
                settle_turn(game, world)  # turn 4: turn % 4 == 0 → expansion
            return game

        game = play()
        aurora, meridian, falcon = game.competitors
        # Without the full pool these would all target nyc (demandIndex 10);
        # the skip rule moves each to its next candidate in demand/table order.
        assert (aurora.routes[-1].city_a, aurora.routes[-1].city_b) == ("hnd", "lhr")
        assert (meridian.routes[-1].city_a, meridian.routes[-1].city_b) == ("lhr", "lax")
        assert (falcon.routes[-1].city_a, falcon.routes[-1].city_b) == ("dxb", "lhr")

        # Determinism: an identical replay lands on identical routes.
        replay = play()
        assert replay.competitors == game.competitors

    def test_ai_routes_consume_pool_and_raise_negotiation_cost(self, game, world):
        # nyc starts at taken 2 (the player's HQ-held slots, no AI ends). At
        # turn 4 every AI's best unserved city is nyc and its pool is not full
        # (2 of 12), so all three open a route there: taken 2 → 5.
        before = compute_slot_market(game, world)["nyc"].taken
        for _ in range(4):
            settle_turn(game, world)
        after = compute_slot_market(game, world)["nyc"].taken
        assert before == 2
        assert after == 5  # 3 new AI route ends each took a pool slot
        # Negotiation cost follows the pool: 9500 × 800 × (1 + 5/12).
        cash_before = game.cash
        run(game, world, {"type": "negotiateSlot", "cityId": "nyc"})
        assert cash_before - game.cash == pytest.approx(10_766_666.67, abs=0.01)


class TestSlotMarketWire:
    @pytest.fixture()
    def client(self) -> TestClient:
        return TestClient(app, raise_server_exceptions=False)

    def test_slot_market_serializes_camel_case(self, client):
        state = client.post(
            "/api/games", json={"airlineName": "Slot Air", "hqCityId": "nyc"}
        ).json()
        assert state["slotMarket"]["nyc"] == {
            "capacity": 12,
            "taken": 2,
            "playerHeld": 2,
            "playerUsed": 0,
        }

        body = client.post(
            f"/api/games/{state['id']}/commands",
            json={
                "commands": [
                    {"type": "negotiateSlot", "cityId": "lax"},
                    {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
                ]
            },
        ).json()
        assert all(r["ok"] for r in body["results"])
        snapshot = body["state"]["slotMarket"]
        assert snapshot["lax"] == {
            "capacity": 11,
            "taken": 1,
            "playerHeld": 1,
            "playerUsed": 1,
        }
        assert snapshot["nyc"]["playerUsed"] == 1
        # $420M − $6.8M lax slot fee.
        assert body["state"]["cash"] == pytest.approx(413_200_000.00, abs=0.01)

        # end-turn responses recompute the snapshot too.
        body = client.post(f"/api/games/{state['id']}/end-turn", json={}).json()
        snapshot = body["state"]["slotMarket"]
        assert snapshot["nyc"]["playerHeld"] == 2
        assert snapshot["hnd"]["taken"] == 2  # AI ends stay visible on the wire
