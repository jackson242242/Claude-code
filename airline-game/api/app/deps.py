"""Process-wide singletons used as FastAPI dependencies."""
from __future__ import annotations

from functools import lru_cache

from app.data import load_world
from app.service import GameService


@lru_cache(maxsize=1)
def get_service() -> GameService:
    return GameService(load_world())
