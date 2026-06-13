"""V3.4 Weekly Challenge pure helpers (CONTRACT.md §3 — 每周挑战与排行榜).

All functions are pure (no I/O, no FastAPI) and fully deterministic:
  - current_week_id()  → ISO week string e.g. "2026-W24"
  - weekly_hq(week_id) → one of the 10 fixed balanced cities
  - week_ends_at_ms(week_id) → epoch ms of the Monday midnight that ends the week
                               (i.e. start of the following week, UTC)

City pool (CONTRACT §3 V3.4): ~10 well-balanced starter cities.
Selection: stable_hash(week_id) % len(pool).
"""
from __future__ import annotations

import hashlib
import datetime

# The 10 balanced starter cities (CONTRACT §3 V3.4 — same list in the spec).
WEEKLY_HQ_POOL: list[str] = [
    "nyc", "ord", "yyz", "lax", "mia",
    "gru", "mad", "sin", "dxb", "syd",
]


def current_week_id(dt: datetime.datetime | None = None) -> str:
    """Return the ISO week string for the given UTC datetime (or now).

    Format: "<year>-W<week>" e.g. "2026-W24".  ISO weeks start on Monday.
    """
    if dt is None:
        dt = datetime.datetime.now(datetime.timezone.utc)
    iso_year, iso_week, _ = dt.isocalendar()
    return f"{iso_year}-W{iso_week:02d}"


def _stable_hash(s: str) -> int:
    """Stable unsigned integer hash of a string (SHA-256 first 8 bytes, big-endian)."""
    digest = hashlib.sha256(s.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big")


def weekly_hq(week_id: str) -> str:
    """Deterministically pick a starter city from WEEKLY_HQ_POOL by week_id.

    Same result for every call with the same week_id — guaranteed by SHA-256.
    """
    idx = _stable_hash(week_id) % len(WEEKLY_HQ_POOL)
    return WEEKLY_HQ_POOL[idx]


def _week_id_to_monday(week_id: str) -> datetime.date:
    """Parse '<year>-W<week>' to the corresponding Monday (ISO 8601)."""
    # Example: "2026-W24" → datetime.date.fromisocalendar(2026, 24, 1)
    parts = week_id.split("-W")
    if len(parts) != 2:
        raise ValueError(f"invalid week_id: {week_id!r}")
    iso_year, iso_week = int(parts[0]), int(parts[1])
    return datetime.date.fromisocalendar(iso_year, iso_week, 1)  # Monday = 1


def week_ends_at_ms(week_id: str) -> int:
    """Return the epoch milliseconds of the start of the week AFTER week_id.

    Semantically this is when the challenge week closes (Monday 00:00 UTC).
    Clients display this as a countdown so players know how long they have.
    """
    monday = _week_id_to_monday(week_id)
    # The week ends at the start of the next Monday.
    next_monday = monday + datetime.timedelta(days=7)
    dt = datetime.datetime(
        next_monday.year,
        next_monday.month,
        next_monday.day,
        tzinfo=datetime.timezone.utc,
    )
    return int(dt.timestamp() * 1000)
