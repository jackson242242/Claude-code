"""Process-wide singletons used as FastAPI dependencies."""
from __future__ import annotations

from functools import lru_cache

from app.data import load_events, load_world
from app.service import GameService


@lru_cache(maxsize=1)
def get_service() -> GameService:
    world = load_world()
    # M3.1: load the static event library and pass it explicitly to the service.
    # This avoids mutating a global, keeping the engine testable in isolation.
    event_pool = load_events()
    return GameService(world, event_pool=event_pool)
