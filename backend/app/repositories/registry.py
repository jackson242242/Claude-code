"""Selects the trip repository: PostgreSQL when configured, else in-memory.

The in-memory repository is a process-wide singleton so trips persist across
requests within a running server.
"""
from __future__ import annotations

from app.db import get_engine
from app.repositories.base import TripRepository
from app.repositories.memory import InMemoryTripRepository
from app.repositories.sql import SqlTripRepository

_memory_repository = InMemoryTripRepository()


def trip_repository() -> TripRepository:
    if get_engine() is not None:
        return SqlTripRepository()
    return _memory_repository
