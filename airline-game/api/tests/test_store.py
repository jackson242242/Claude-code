"""Tests for M5.1 store abstraction: MemoryStore, JsonFileStore, PostgresStore.

Coverage:
- JSON round-trip across simulated restart (same file, new store instance)
- Corrupted file → clean start, no crash
- Missing file → clean start, no crash
- Write-failure degradation (monkeypatch to raise on write)
- UUID id format in file/pg modes
- PostgreSQL: attempt connect; skip if unavailable, else test round-trip + upsert
"""
from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

import pytest

from app.data import load_world
from app.engine.state import new_game
from app.store import (
    JsonFileStore,
    MemoryStore,
    state_from_dict,
    state_to_dict,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fresh_game(world, game_id: str = "g-store-test"):
    return new_game(game_id, "Store Air", world.cities["nyc"])


def _full_game(world):
    """A game that has had some turns advanced, with fleet, routes, and finance."""
    from app.engine.commands import apply_commands
    from app.engine.simulate import settle_turn

    state = new_game("g-full", "Full Air", world.cities["nyc"])
    apply_commands(
        state,
        world,
        [
            {"type": "leaseAircraft", "modelId": "a320neo"},
            {"type": "negotiateSlot", "cityId": "lax"},
            {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
            {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
        ],
    )
    settle_turn(state, world, event_pool=[])
    return state


# ---------------------------------------------------------------------------
# MemoryStore
# ---------------------------------------------------------------------------


class TestMemoryStore:
    def test_next_id_is_sequential(self):
        store = MemoryStore()
        assert store.next_id() == "g-1"
        assert store.next_id() == "g-2"
        assert store.next_id() == "g-3"

    def test_add_and_get(self, world):
        store = MemoryStore()
        state = _fresh_game(world)
        store.add(state)
        fetched = store.get(state.id)
        assert fetched is state  # same object in memory

    def test_get_missing_returns_none(self):
        store = MemoryStore()
        assert store.get("nope") is None

    def test_save_updates_existing(self, world):
        store = MemoryStore()
        state = _fresh_game(world)
        store.add(state)
        state.cash = 999.0
        store.save(state)
        assert store.get(state.id).cash == 999.0

    def test_count_empty_store(self):
        store = MemoryStore()
        assert store.count() == 0

    def test_count_after_add(self, world):
        store = MemoryStore()
        store.add(_fresh_game(world, game_id="g-a"))
        assert store.count() == 1
        store.add(_fresh_game(world, game_id="g-b"))
        assert store.count() == 2

    def test_count_unchanged_by_save(self, world):
        store = MemoryStore()
        state = _fresh_game(world)
        store.add(state)
        state.cash = 1.0
        store.save(state)
        assert store.count() == 1


# ---------------------------------------------------------------------------
# state_to_dict / state_from_dict round-trip
# ---------------------------------------------------------------------------


class TestSerialisation:
    def test_round_trip_fresh_game(self, world):
        original = _fresh_game(world)
        d = state_to_dict(original)
        restored = state_from_dict(d)
        assert restored.id == original.id
        assert restored.airline_name == original.airline_name
        assert restored.cash == original.cash
        assert restored.slots_held == original.slots_held
        assert restored.seen_news_ids == original.seen_news_ids
        assert restored.next_aircraft_seq == original.next_aircraft_seq
        assert restored.next_route_seq == original.next_route_seq

    def test_round_trip_advanced_game(self, world):
        original = _full_game(world)
        d = state_to_dict(original)
        restored = state_from_dict(d)

        assert restored.id == original.id
        assert restored.turn == original.turn
        assert restored.cash == pytest.approx(original.cash, abs=1)
        assert len(restored.fleet) == len(original.fleet)
        assert len(restored.routes) == len(original.routes)
        assert restored.routes[0].city_a == original.routes[0].city_a
        assert restored.routes[0].city_b == original.routes[0].city_b
        # last_quarter is set after settlement
        assert restored.routes[0].last_quarter is not None
        assert restored.routes[0].last_quarter.pax == original.routes[0].last_quarter.pax
        assert restored.finance.last_quarter is not None
        assert (
            restored.finance.last_quarter.profit
            == pytest.approx(original.finance.last_quarter.profit, abs=1)
        )
        assert len(restored.competitors) == len(original.competitors)
        assert restored.competitors[0].routes[0].city_a == (
            original.competitors[0].routes[0].city_a
        )
        assert restored.negative_cash_quarters == original.negative_cash_quarters
        assert restored.next_aircraft_seq == original.next_aircraft_seq
        assert restored.next_route_seq == original.next_route_seq

    def test_internal_fields_preserved(self, world):
        original = _fresh_game(world)
        original.negative_cash_quarters = 1
        original.next_aircraft_seq = 42
        original.next_route_seq = 7
        original.seen_news_ids = {"news-a", "news-b"}
        original.slots_held = {"nyc": 3, "lax": 1}
        original.last_negotiation_turn = {"nyc": 2}

        d = state_to_dict(original)
        restored = state_from_dict(d)

        assert restored.negative_cash_quarters == 1
        assert restored.next_aircraft_seq == 42
        assert restored.next_route_seq == 7
        assert restored.seen_news_ids == {"news-a", "news-b"}
        assert restored.slots_held == {"nyc": 3, "lax": 1}
        assert restored.last_negotiation_turn == {"nyc": 2}


# ---------------------------------------------------------------------------
# JsonFileStore
# ---------------------------------------------------------------------------


class TestJsonFileStore:
    def test_uuid_id_format(self, tmp_path, world):
        store = JsonFileStore(tmp_path / "games.json")
        game_id = store.next_id()
        # Must be a valid UUID4 string
        parsed = uuid.UUID(game_id, version=4)
        assert str(parsed) == game_id

    def test_missing_file_is_clean_start(self, tmp_path, world):
        store = JsonFileStore(tmp_path / "nonexistent.json")
        assert store.get("anything") is None

    def test_add_persists_to_file(self, tmp_path, world):
        path = tmp_path / "games.json"
        store = JsonFileStore(path)
        state = _fresh_game(world, game_id=store.next_id())
        store.add(state)
        assert path.exists()
        raw = json.loads(path.read_text())
        assert state.id in raw

    def test_round_trip_across_restart(self, tmp_path, world):
        """Save a game, create a new store instance pointing at same file, verify load."""
        path = tmp_path / "games.json"
        store1 = JsonFileStore(path)
        game_id = store1.next_id()
        original = _fresh_game(world, game_id=game_id)
        store1.add(original)

        # Simulate restart: new store instance reads the same file.
        store2 = JsonFileStore(path)
        restored = store2.get(game_id)
        assert restored is not None
        assert restored.id == original.id
        assert restored.airline_name == original.airline_name
        assert restored.cash == original.cash

    def test_round_trip_advanced_game_across_restart(self, tmp_path, world):
        path = tmp_path / "games.json"
        store1 = JsonFileStore(path)
        game_id = store1.next_id()
        # Re-use full game but give it the uuid id
        original = _full_game(world)
        original.id = game_id
        store1.add(original)

        store2 = JsonFileStore(path)
        restored = store2.get(game_id)
        assert restored is not None
        assert restored.turn == original.turn
        assert restored.routes[0].last_quarter is not None
        assert restored.fleet[0].model_id == "a320neo"

    def test_save_overwrites_existing(self, tmp_path, world):
        path = tmp_path / "games.json"
        store = JsonFileStore(path)
        game_id = store.next_id()
        state = _fresh_game(world, game_id=game_id)
        store.add(state)
        state.cash = 123_456.0
        store.save(state)

        store2 = JsonFileStore(path)
        restored = store2.get(game_id)
        assert restored.cash == pytest.approx(123_456.0)

    def test_corrupted_file_clean_start(self, tmp_path, world):
        path = tmp_path / "games.json"
        path.write_text("THIS IS NOT JSON {{{{", encoding="utf-8")
        # Should not raise; starts clean.
        store = JsonFileStore(path)
        assert store.get("anything") is None

    def test_corrupted_game_entry_skipped(self, tmp_path, world):
        path = tmp_path / "games.json"
        # Write a file with one valid and one corrupt game entry
        raw = {
            "good-id": state_to_dict(_fresh_game(world, "good-id")),
            "bad-id": {"broken": True, "notAGame": 123},
        }
        path.write_text(json.dumps(raw), encoding="utf-8")
        store = JsonFileStore(path)
        # Good game is loadable; bad game is silently skipped
        assert store.get("good-id") is not None
        assert store.get("bad-id") is None

    def test_write_failure_degrades_gracefully(self, tmp_path, world, monkeypatch):
        """Write failures must log and continue; in-memory state stays intact."""
        path = tmp_path / "games.json"
        store = JsonFileStore(path)
        game_id = store.next_id()
        state = _fresh_game(world, game_id=game_id)

        # Monkeypatch open to raise on any write attempt after store is created.
        original_open = open

        def broken_open(file, mode="r", **kwargs):
            if "w" in str(mode):
                raise OSError("simulated write failure")
            return original_open(file, mode, **kwargs)

        import builtins
        monkeypatch.setattr(builtins, "open", broken_open)

        # Should not raise even though writing fails.
        store.add(state)
        # In-memory lookup still works.
        assert store.get(game_id) is not None

    def test_auto_creates_directory(self, tmp_path, world):
        nested = tmp_path / "deep" / "nested" / "games.json"
        store = JsonFileStore(nested)
        game_id = store.next_id()
        state = _fresh_game(world, game_id=game_id)
        store.add(state)
        assert nested.exists()

    def test_multiple_games_all_persisted(self, tmp_path, world):
        path = tmp_path / "games.json"
        store = JsonFileStore(path)
        ids = []
        for i in range(3):
            gid = store.next_id()
            ids.append(gid)
            s = _fresh_game(world, game_id=gid)
            s.airline_name = f"Airline {i}"
            store.add(s)

        store2 = JsonFileStore(path)
        for gid in ids:
            assert store2.get(gid) is not None

    def test_count_empty_store(self, tmp_path):
        store = JsonFileStore(tmp_path / "games.json")
        assert store.count() == 0

    def test_count_after_add(self, tmp_path, world):
        store = JsonFileStore(tmp_path / "games.json")
        store.add(_fresh_game(world, game_id=store.next_id()))
        assert store.count() == 1
        store.add(_fresh_game(world, game_id=store.next_id()))
        assert store.count() == 2


# ---------------------------------------------------------------------------
# PostgresStore
# ---------------------------------------------------------------------------


def _postgres_dsn() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.mark.skipif(
    _postgres_dsn() is None,
    reason="DATABASE_URL not set — PostgresStore tests skipped",
)
class TestPostgresStore:
    def test_round_trip(self, world):
        from app.store import PostgresStore

        dsn = _postgres_dsn()
        try:
            store = PostgresStore(dsn)
            store._connect()  # explicit connect to catch unreachable DB early
        except Exception as exc:
            pytest.skip(f"Cannot connect to Postgres: {exc}")

        game_id = store.next_id()
        original = _fresh_game(world, game_id=game_id)
        store.add(original)

        restored = store.get(game_id)
        assert restored is not None
        assert restored.id == game_id
        assert restored.airline_name == original.airline_name
        assert restored.cash == original.cash

    def test_upsert_updates_state(self, world):
        from app.store import PostgresStore

        dsn = _postgres_dsn()
        try:
            store = PostgresStore(dsn)
            store._connect()
        except Exception as exc:
            pytest.skip(f"Cannot connect to Postgres: {exc}")

        game_id = store.next_id()
        state = _fresh_game(world, game_id=game_id)
        store.add(state)

        state.cash = 999_999.0
        store.save(state)

        restored = store.get(game_id)
        assert restored.cash == pytest.approx(999_999.0)

    def test_uuid_id_format(self):
        from app.store import PostgresStore

        store = PostgresStore("dummy_dsn")  # no connection needed just for next_id
        game_id = store.next_id()
        parsed = uuid.UUID(game_id, version=4)
        assert str(parsed) == game_id

    def test_get_missing_returns_none(self, world):
        from app.store import PostgresStore

        dsn = _postgres_dsn()
        try:
            store = PostgresStore(dsn)
            store._connect()
        except Exception as exc:
            pytest.skip(f"Cannot connect to Postgres: {exc}")

        assert store.get("definitely-not-a-real-game-id") is None
