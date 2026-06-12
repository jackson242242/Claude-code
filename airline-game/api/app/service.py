"""Game service + in-memory repository.

M1 stores games in a process-local dict (CONTRACT §1); the service interface
is the seam where M5 swaps in real storage.
"""
from __future__ import annotations

from typing import Any, Mapping, Sequence

from app.engine import commands as engine_commands
from app.engine import simulate
from app.engine.commands import CommandResult
from app.engine.simulate import TurnReport
from app.engine.state import GameEvent, GameState, World, new_game


class GameNotFoundError(Exception):
    pass


class InvalidInputError(Exception):
    pass


class GameRepository:
    """In-memory store with a process-local auto-increment id."""

    def __init__(self) -> None:
        self._games: dict[str, GameState] = {}
        self._seq = 0

    def next_id(self) -> str:
        self._seq += 1
        return f"g-{self._seq}"

    def add(self, state: GameState) -> None:
        self._games[state.id] = state

    def get(self, game_id: str) -> GameState | None:
        return self._games.get(game_id)


class GameService:
    def __init__(
        self,
        world: World,
        repository: GameRepository | None = None,
        event_pool: list[GameEvent] | None = None,
    ) -> None:
        self.world = world
        self.repository = repository or GameRepository()
        # M3.1: the event pool passed to settle_turn on every end-turn call.
        # None here means "use the global default pool" (loaded by app.data.load_events).
        self._event_pool = event_pool

    def create_game(self, airline_name: str, hq_city_id: str) -> GameState:
        name = airline_name.strip()
        if not name:
            raise InvalidInputError("airlineName must not be empty")
        hq_city = self.world.cities.get(hq_city_id)
        if hq_city is None:
            raise InvalidInputError(f"unknown city: {hq_city_id}")
        state = new_game(self.repository.next_id(), name, hq_city)
        self.repository.add(state)
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
            state, self.world, self._event_pool, news_pool_events
        )
        return state, report
