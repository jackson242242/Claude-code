"""M4.3 News events pool — in-process shared state with JSON persistence.

The pool is a module-level list so it is shared across requests.  On startup
the file is read if it exists; every write flushes to disk.

Pool file path: EVENTS_POOL_FILE env var, default api/var/events-pool.json.
The directory is created automatically.

Public API (module-level functions):
  add_events(events: list[GameEvent]) -> None
  list_pending() -> list[GameEvent]
  load_pool() -> None    # called once at startup (or in tests)
  reset_pool() -> None   # test helper to clear in-memory state

NewsPoolEvent dataclass holds one event + its ingest timestamp.
Pruning: events older than 14 days are discarded at ingest time.
Deduplication: events with the same id are silently dropped.
"""
from __future__ import annotations

import json
import logging
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from app.engine.events import validate_event
from app.engine.state import GameEvent

logger = logging.getLogger(__name__)

_PRUNE_DAYS = 14
_DEFAULT_POOL_PATH = Path(__file__).resolve().parents[2] / "var" / "events-pool.json"


def _pool_path() -> Path:
    env = os.environ.get("EVENTS_POOL_FILE", "")
    if env:
        return Path(env)
    return _DEFAULT_POOL_PATH


# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------

@dataclass
class NewsPoolEvent:
    """One news event held in the pending pool."""
    event: GameEvent
    ingested_at: datetime


# The live pool: list of NewsPoolEvent, newest first after each add_events call.
_pool: list[NewsPoolEvent] = []
_pool_loaded: bool = False


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------


def _event_to_dict(ev: GameEvent) -> dict[str, Any]:
    return {
        "id": ev.id,
        "source": ev.source,
        "headline": ev.headline,
        "detail": ev.detail,
        "sourceUrl": ev.source_url,
        "severity": ev.severity,
        "durationTurns": ev.duration_turns,
        "scope": {"kind": ev.scope.kind, "ids": list(ev.scope.ids)},
        "effects": [{"target": e.target, "mult": e.mult} for e in ev.effects],
    }


def _pool_event_to_dict(pe: NewsPoolEvent) -> dict[str, Any]:
    return {
        "event": _event_to_dict(pe.event),
        "ingestedAt": pe.ingested_at.isoformat(),
    }


def _pool_event_from_dict(d: dict[str, Any]) -> NewsPoolEvent | None:
    try:
        ev = validate_event(d["event"])
        if ev is None:
            return None
        ingested_at = datetime.fromisoformat(d["ingestedAt"])
        # Ensure timezone-aware
        if ingested_at.tzinfo is None:
            ingested_at = ingested_at.replace(tzinfo=timezone.utc)
        return NewsPoolEvent(event=ev, ingested_at=ingested_at)
    except (KeyError, ValueError, TypeError) as exc:
        logger.debug("events_pool: skip malformed pool entry: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------


def _save() -> None:
    """Write the in-memory pool to the JSON file."""
    try:
        path = _pool_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump([_pool_event_to_dict(pe) for pe in _pool], fh, indent=2)
    except Exception as exc:
        logger.warning("events_pool: failed to save pool: %s", exc)


def load_pool() -> None:
    """Load pool from disk into module state.  Safe to call multiple times."""
    global _pool, _pool_loaded
    path = _pool_path()
    if not path.exists():
        _pool_loaded = True
        return
    try:
        with open(path, encoding="utf-8") as fh:
            raw_list = json.load(fh)
        loaded: list[NewsPoolEvent] = []
        for raw in raw_list:
            pe = _pool_event_from_dict(raw)
            if pe is not None:
                loaded.append(pe)
        _pool = loaded
        _pool_loaded = True
        logger.debug("events_pool: loaded %d events from %s", len(_pool), path)
    except Exception as exc:
        logger.warning("events_pool: failed to load pool from %s: %s", path, exc)
        _pool = []
        _pool_loaded = True


def reset_pool() -> None:
    """Clear in-memory pool state.  Used by tests to isolate state."""
    global _pool, _pool_loaded
    _pool = []
    _pool_loaded = False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def add_events(events: list[GameEvent]) -> None:
    """Add events to the pool, deduplicating by id and pruning stale entries.

    - Existing ids are silently dropped (deduplication).
    - Events older than 14 days (measured at ingest time) are pruned.
    - Persists after every successful add.
    """
    global _pool

    if not _pool_loaded:
        load_pool()

    now = datetime.now(tz=timezone.utc)
    cutoff = now - timedelta(days=_PRUNE_DAYS)

    # Existing ids (pre-prune)
    existing_ids = {pe.event.id for pe in _pool}

    new_entries: list[NewsPoolEvent] = []
    for ev in events:
        if ev.id not in existing_ids:
            new_entries.append(NewsPoolEvent(event=ev, ingested_at=now))
            existing_ids.add(ev.id)

    # Merge and prune in one pass: keep existing non-stale + new entries
    combined = [pe for pe in _pool if pe.ingested_at >= cutoff] + new_entries

    # Sort newest first (by ingest time)
    combined.sort(key=lambda pe: pe.ingested_at, reverse=True)

    _pool = combined
    if new_entries:
        _save()


def list_pending() -> list[GameEvent]:
    """Return all pooled events that are not yet activated, newest first.

    This function does NOT know which games have seen which events — that
    filtering is done by the caller (settle_turn / GameService).
    """
    if not _pool_loaded:
        load_pool()

    now = datetime.now(tz=timezone.utc)
    cutoff = now - timedelta(days=_PRUNE_DAYS)

    return [
        pe.event
        for pe in _pool
        if pe.ingested_at >= cutoff
    ]
