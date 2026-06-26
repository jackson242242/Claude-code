"""Game service — business logic layer (M5.1: pluggable store abstraction).

Store selection (CONTRACT §1):
  - No env vars set  → MemoryStore  (test mode; g-1, g-2 ids)
  - GAMES_FILE set   → JsonFileStore (uuid4 ids)
  - DATABASE_URL set → PostgresStore (uuid4 ids; overrides GAMES_FILE)

The service calls store.save() after every mutation so all three persistence
modes stay consistent without callers needing to think about it.
"""
from __future__ import annotations

import logging
from typing import Any, Mapping, Sequence
from uuid import uuid4

from app.engine import commands as engine_commands
from app.engine import simulate
from app.engine.commands import CommandResult
from app.engine.decisions import DecisionEvent
from app.engine.simulate import TurnReport
from app.engine.state import GameEvent, GameState, World, new_game
from app.store import AbstractStore, MemoryStore

logger = logging.getLogger(__name__)


class GameNotFoundError(Exception):
    pass


class InvalidInputError(Exception):
    pass


class ServiceUnavailableError(Exception):
    pass


# ---------------------------------------------------------------------------
# Legacy shim — kept so existing tests that import GameRepository still work.
# ---------------------------------------------------------------------------


class GameRepository(MemoryStore):
    """Backward-compatible alias for MemoryStore (used by older tests)."""


_DEFAULT_MAX_GAMES = 500


class GameService:
    def __init__(
        self,
        world: World,
        repository: AbstractStore | None = None,
        event_pool: list[GameEvent] | None = None,
        decision_pool: list[DecisionEvent] | None = None,
        max_games: int = _DEFAULT_MAX_GAMES,
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
        # S6: upper bound on simultaneous in-memory games (default 500).
        self._max_games = max_games

    def create_game(self, airline_name: str, hq_city_id: str) -> GameState:
        name = airline_name.strip()
        if not name:
            raise InvalidInputError("airlineName must not be empty")
        hq_city = self.world.cities.get(hq_city_id)
        if hq_city is None:
            raise InvalidInputError(f"unknown city: {hq_city_id}")
        if self.repository.count() >= self._max_games:
            raise ServiceUnavailableError(
                f"服务器游戏数量已达上限（{self._max_games}），请稍后重试"
            )
        state = new_game(self.repository.next_id(), name, hq_city)
        self.repository.add(state)  # add() also persists for file/pg stores
        return state

    def create_weekly_game(self, airline_name: str, week_id: str, hq_city_id: str) -> GameState:
        """V3.4: Create a weekly challenge game with fixed HQ, seed=weekId, and a
        unique player_token for leaderboard isYou matching."""
        name = airline_name.strip()
        if not name:
            raise InvalidInputError("airlineName must not be empty")
        hq_city = self.world.cities.get(hq_city_id)
        if hq_city is None:
            raise InvalidInputError(f"unknown city: {hq_city_id}")
        if self.repository.count() >= self._max_games:
            raise ServiceUnavailableError(
                f"服务器游戏数量已达上限（{self._max_games}），请稍后重试"
            )
        state = new_game(self.repository.next_id(), name, hq_city)
        # Override V3.4 fields: seed = weekId so all participants draw the same events.
        state.seed = week_id
        state.weekly_week_id = week_id
        state.player_token = str(uuid4())
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
        # V3.4: auto-record leaderboard for weekly challenge games that just finished.
        # Guard: only record once (status transitions from active → finished exactly once).
        if (
            state.status == "finished"
            and state.weekly_week_id is not None
            and state.player_token is not None
            and state.final_result is not None
        ):
            try:
                self._record_weekly_score(state)
            except Exception as exc:
                logger.warning("leaderboard auto-record failed: %s", exc)
        self.repository.save(state)  # M5.1: persist after every mutation
        return state, report

    def _record_weekly_score(self, state: GameState) -> None:
        """V3.4: Compute score per CONTRACT §3 and record to leaderboard (once)."""
        from app.leaderboard_store import get_leaderboard_store

        fr = state.final_result
        if fr is None:
            return

        # score = max(0, round(lifetimeProfit/1e6)) + round(finalMarketShare×5000)
        #         + (rank==1 ? 2000 : 0)
        profit_pts = max(0, round(state.lifetime.profit / 1_000_000))
        share_pts = round(state.market_share * 5000)
        rank_bonus = 2000 if fr.rank == 1 else 0
        score = profit_pts + share_pts + rank_bonus

        store = get_leaderboard_store()
        store.record(
            week_id=state.weekly_week_id,
            name=state.airline_name,
            score=score,
            profit=state.lifetime.profit,
            share=state.market_share,
            player_token=state.player_token,
        )
