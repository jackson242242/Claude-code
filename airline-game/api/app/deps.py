"""Process-wide singletons used as FastAPI dependencies (M5.1: store selection)."""
from __future__ import annotations

import os
from functools import lru_cache

from app.data import load_decisions, load_events, load_world
from app.service import GameService


def _make_store():
    """Select and instantiate the right store from env vars (CONTRACT §1).

    DATABASE_URL set   → PostgresStore
    GAMES_FILE set     → JsonFileStore (empty string → default path)
    Neither set        → MemoryStore   (test mode; g-1, g-2 ids)
    """
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        from app.store import PostgresStore
        return PostgresStore(db_url)

    games_file = os.environ.get("GAMES_FILE")
    if games_file is not None:
        from pathlib import Path
        from app.store import JsonFileStore
        path = Path(games_file) if games_file else None
        return JsonFileStore(path)

    # No env vars → MemoryStore (test mode)
    from app.store import MemoryStore
    return MemoryStore()


@lru_cache(maxsize=1)
def get_service() -> GameService:
    world = load_world()
    # M3.1: load the static event library and pass it explicitly to the service.
    # This avoids mutating a global, keeping the engine testable in isolation.
    event_pool = load_events()
    # V3.7: load the decision event pool.
    decision_pool = load_decisions()
    store = _make_store()
    # S6: honour MAX_GAMES env var (default 500) to cap memory usage.
    max_games = int(os.environ.get("MAX_GAMES", "500"))
    return GameService(
        world, repository=store, event_pool=event_pool, decision_pool=decision_pool,
        max_games=max_games,
    )
