"""Game service — business logic layer (M5.1: pluggable store abstraction).

Store selection (CONTRACT §1):
  - No env vars set  → MemoryStore  (test mode; g-1, g-2 ids)
  - GAMES_FILE set   → JsonFileStore (uuid4 ids)
  - DATABASE_URL set → PostgresStore (uuid4 ids; overrides GAMES_FILE)

The service calls store.save() after every mutation so all three persistence
modes stay consistent without callers needing to think about it.
"""
from __future__ import annotations

from typing import Any, Mapping, Sequence

from app.engine import commands as engine_commands
from app.engine import simulate
from app.engine.commands import CommandResult
from app.engine.decisions import DecisionEvent
from app.engine.simulate import TurnReport
from app.engine.state import GameEvent, GameState, World, new_game
from app.store import AbstractStore, MemoryStore


class GameNotFoundError(Exception):
    pass


class InvalidInputError(Exception):
    pass


# ---------------------------------------------------------------------------
# Legacy shim — kept so existing tests that import GameRepository still work.
# ---------------------------------------------------------------------------


class GameRepository(MemoryStore):
    """Backward-compatible alias for MemoryStore (used by older tests)."""


class GameService:
    def __init__(
        self,
        world: World,
        repository: AbstractStore | None = None,
        event_pool: list[GameEvent] | None = None,
        decision_pool: list[DecisionEvent] | None = None,
    ) -> None:
        self.world = world
        # Accept both the old GameRepository and the new AbstractStore subclasses.
        self.repository: AbstractStore = repository or MemoryStore()
        # M3.1: the event pool passed to settle_turn on every end-turn call.
        # None here means "use the global default pool" (loaded by app.data.load_events).
        self._event_pool = event_pool
        # V3.7: the decision event pool passed to settle_turn on every end-turn call.
        # None here means "use the global default pool" (loaded by app.data.load_decisions).
        self._decision_pool = decision_pool

    def create_game(self, airline_name: str, hq_city_id: str) -> GameState:
        name = airline_name.strip()
        if not name:
            raise InvalidInputError("airlineName must not be empty")
        hq_city = self.world.cities.get(hq_city_id)
        if hq_city is None:
            raise InvalidInputError(f"unknown city: {hq_city_id}")
        state = new_game(self.repository.next_id(), name, hq_city)
        self.repository.add(state)  # add() also persists for file/pg stores
        return state

    def get_game(self, game_id: str) -> GameState:
        state = self.repository.get(game_id)
        if state is None:
            raise GameNotFoundError(f"game not found: {game_id}")
        return state

    def apply_commands(
        self, game_id: str, commands: Sequence[Mapping[str, Any]]
    ) -> tuple[GameState, list[CommandResult]]:
        state = self.get_game(game_id)
        results = engine_commands.apply_commands(state, self.world, commands)
        self.repository.save(state)  # M5.1: persist after every mutation
        return state, results

    def end_turn(self, game_id: str) -> tuple[GameState, TurnReport]:
        state = self.get_game(game_id)
        # M4.3: gather pending news pool events (if pool is available).
        # Any failure is silently swallowed — the game sees only the static pool.
        news_pool_events = None
        try:
            from app.services.events_pool import list_pending
            news_pool_events = list_pending()
        except Exception:
            pass
        report = simulate.settle_turn(
            state, self.world, self._event_pool, news_pool_events,
            self._decision_pool,
        )
        self.repository.save(state)  # M5.1: persist after every mutation
        return state, report
