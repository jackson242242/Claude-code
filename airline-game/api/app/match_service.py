"""Match service — orchestration layer for V3.3 multiplayer matches.

Thin coordinator between the HTTP layer (routes/matches.py) and the pure
engine (engine/match.py) + in-memory store (match_store.py).
"""
from __future__ import annotations

from typing import Any

from app.engine.match import (
    Match,
    MatchError,
    add_player,
    apply_player_commands,
    mark_ready,
    maybe_auto_settle,
    new_match,
    settle_match,
    start_match,
)
from app.engine.state import World
from app import match_store


class MatchNotFoundError(Exception):
    pass


class MatchService:
    def __init__(
        self,
        world: World,
        event_pool: list | None = None,
        decision_pool: list | None = None,
    ) -> None:
        self.world = world
        self._event_pool = event_pool
        self._decision_pool = decision_pool

    def _get_match(self, code: str) -> Match:
        match = match_store.get(code)
        if match is None:
            raise MatchNotFoundError(f"match not found: {code}")
        return match

    def _news_pool(self) -> list | None:
        """Gather pending news pool events (M4.3). Silently returns None on failure."""
        try:
            from app.services.events_pool import list_pending
            return list_pending()
        except Exception:
            return None

    def create_match(
        self,
        host_name: str,
        host_hq_city_id: str,
        max_players: int = 4,
        fill_with_ai: bool = True,
    ) -> tuple[str, str]:
        """Create a new match. Returns (code, host_player_id)."""
        code = match_store.generate_code()
        match = new_match(code, host_name, host_hq_city_id, max_players, fill_with_ai, self.world)
        match_store.add(match)
        return code, match.players[0].player_id

    def join_match(self, code: str, name: str, hq_city_id: str) -> str:
        """Join a lobby. Returns the new player_id."""
        match = self._get_match(code)
        return add_player(match, name, hq_city_id, self.world)

    def start_match(self, code: str, player_id: str) -> Match:
        """Transition lobby → active. Returns the match."""
        match = self._get_match(code)
        start_match(match, player_id)
        return match

    def get_match(self, code: str, player_id: str) -> Match:
        """Get match (with lazy deadline auto-settle check)."""
        match = self._get_match(code)
        if match.phase == "active":
            maybe_auto_settle(
                match, self.world, self._event_pool,
                self._news_pool(), self._decision_pool
            )
        return match

    def apply_commands(self, code: str, player_id: str, commands: list[dict]) -> tuple[Match, list]:
        """Apply commands to a player's state. Returns (match, results)."""
        match = self._get_match(code)
        # Check deadline before commands
        if match.phase == "active":
            maybe_auto_settle(
                match, self.world, self._event_pool,
                self._news_pool(), self._decision_pool
            )
        if match.phase == "finished":
            raise MatchError("match is finished")
        results = apply_player_commands(match, player_id, commands, self.world)
        return match, results

    def mark_ready(self, code: str, player_id: str) -> Match:
        """Mark player as ready; settle if all ready or deadline passed. Returns match."""
        match = self._get_match(code)
        should_settle = mark_ready(match, player_id)
        if should_settle and match.phase == "active":
            settle_match(
                match, self.world, self._event_pool,
                self._news_pool(), self._decision_pool
            )
        return match
