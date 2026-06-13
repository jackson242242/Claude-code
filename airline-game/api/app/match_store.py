"""In-memory match store for V3.3 multiplayer rooms.

Keyed by 6-char uppercase alphanumeric code. Collision retry on creation.
MVP: resets on process restart (no persistence needed for V3.3).
"""
from __future__ import annotations

import random
import string
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.engine.match import Match

_MATCHES: dict[str, "Match"] = {}


def generate_code() -> str:
    """Generate a unique 6-char uppercase alphanumeric code with collision retry."""
    chars = string.ascii_uppercase + string.digits
    for _ in range(1000):
        code = "".join(random.choices(chars, k=6))
        if code not in _MATCHES:
            return code
    raise RuntimeError("could not generate a unique match code")


def add(match: "Match") -> None:
    _MATCHES[match.code] = match


def get(code: str) -> "Match | None":
    return _MATCHES.get(code.upper())


def all_codes() -> list[str]:
    return list(_MATCHES.keys())


def clear() -> None:
    """Clear all matches (used in tests)."""
    _MATCHES.clear()
