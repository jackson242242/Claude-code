"""Shared helpers for the mock providers."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone


def seeded_int(seed: str, low: int, high: int) -> int:
    """Stable FNV-1a-based pseudo-random integer in [low, high] from a seed."""
    value = 2166136261
    for char in seed:
        value ^= ord(char)
        value = (value * 16777619) & 0xFFFFFFFF
    return low + (value % (high - low + 1))


def _iso(moment: datetime) -> str:
    return moment.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def leg(date: str, start_hour: int, duration_minutes: int) -> tuple[str, str]:
    """Returns (departUtc, arriveUtc) ISO strings for a travel leg."""
    year, month, day = (int(part) for part in date.split("-"))
    depart = datetime(year, month, day, start_hour, 0, 0, tzinfo=timezone.utc)
    arrive = depart + timedelta(minutes=duration_minutes)
    return _iso(depart), _iso(arrive)
