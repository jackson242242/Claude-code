"""V3.4 Leaderboard persistence (CONTRACT.md §3 — 每周挑战与排行榜).

Postgres table ``leaderboard`` (auto-created on first connect):
  id SERIAL PRIMARY KEY
  week_id TEXT NOT NULL
  name TEXT NOT NULL
  score INTEGER NOT NULL
  profit DOUBLE PRECISION NOT NULL
  share DOUBLE PRECISION NOT NULL
  player_token TEXT NOT NULL
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()

In-memory fallback: when no DATABASE_URL is configured (or when Postgres is
unavailable during testing) an in-process list is used.  Multiple
LeaderboardStore instances share the same in-memory list via a module-level
variable so tests stay isolated from the network.

API
---
record(week_id, name, score, profit, share, player_token) → None
top(week_id, limit=50) → list[dict]   (score DESC; keys: week_id, name, score,
                                         profit, share, player_token)
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

# Module-level in-memory store (list of row dicts) used when DATABASE_URL is absent.
_MEMORY_STORE: list[dict[str, Any]] = []


@dataclass
class LeaderboardStore:
    """V3.4 leaderboard persistence — Postgres when DATABASE_URL is set,
    in-memory list otherwise.  Multiple instances share the same in-memory
    list so test state is predictable within a process."""

    _dsn: str | None = field(default=None, init=False)
    _conn: Any = field(default=None, init=False)
    _schema_ready: bool = field(default=False, init=False)

    def __post_init__(self) -> None:
        self._dsn = os.environ.get("DATABASE_URL") or None

    # ------------------------------------------------------------------
    # Internal: Postgres connection + schema bootstrap
    # ------------------------------------------------------------------

    def _connect(self) -> Any:
        """Return an open psycopg connection; create the table if needed."""
        if self._conn is None or self._conn.closed:
            import psycopg  # type: ignore[import-untyped]
            self._conn = psycopg.connect(self._dsn, autocommit=True)
            self._schema_ready = False
        if not self._schema_ready:
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS leaderboard (
                    id SERIAL PRIMARY KEY,
                    week_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    profit DOUBLE PRECISION NOT NULL,
                    share DOUBLE PRECISION NOT NULL,
                    player_token TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
                """
            )
            self._schema_ready = True
        return self._conn

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def record(
        self,
        week_id: str,
        name: str,
        score: int,
        profit: float,
        share: float,
        player_token: str,
    ) -> None:
        """Append one leaderboard row (no de-dup guard here — callers must
        ensure they only call once per finished weekly game)."""
        if self._dsn:
            try:
                conn = self._connect()
                conn.execute(
                    """
                    INSERT INTO leaderboard
                        (week_id, name, score, profit, share, player_token)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (week_id, name, score, float(profit), float(share), player_token),
                )
                return
            except Exception as exc:
                logger.warning("leaderboard_store: postgres record failed: %s", exc)
                # Fall through to in-memory fallback on error.

        # In-memory fallback.
        _MEMORY_STORE.append(
            {
                "week_id": week_id,
                "name": name,
                "score": score,
                "profit": float(profit),
                "share": float(share),
                "player_token": player_token,
            }
        )

    def top(self, week_id: str, limit: int = 50) -> list[dict[str, Any]]:
        """Return up to ``limit`` rows for ``week_id``, ordered by score DESC."""
        if self._dsn:
            try:
                conn = self._connect()
                rows = conn.execute(
                    """
                    SELECT week_id, name, score, profit, share, player_token
                    FROM leaderboard
                    WHERE week_id = %s
                    ORDER BY score DESC
                    LIMIT %s
                    """,
                    (week_id, limit),
                ).fetchall()
                return [
                    {
                        "week_id": r[0],
                        "name": r[1],
                        "score": r[2],
                        "profit": r[3],
                        "share": r[4],
                        "player_token": r[5],
                    }
                    for r in rows
                ]
            except Exception as exc:
                logger.warning("leaderboard_store: postgres top() failed: %s", exc)
                # Fall through to in-memory fallback on error.

        # In-memory fallback.
        candidates = [r for r in _MEMORY_STORE if r["week_id"] == week_id]
        candidates.sort(key=lambda r: -r["score"])
        return candidates[:limit]


# ---------------------------------------------------------------------------
# Module-level singleton (used by the service layer and routes).
# ---------------------------------------------------------------------------

_store: LeaderboardStore | None = None


def get_leaderboard_store() -> LeaderboardStore:
    """Return the process-wide LeaderboardStore singleton."""
    global _store
    if _store is None:
        _store = LeaderboardStore()
    return _store


def reset_memory_store() -> None:
    """Clear the in-memory leaderboard rows (for test isolation)."""
    global _store
    _MEMORY_STORE.clear()
    _store = None  # force re-init so DSN is re-read on next call
