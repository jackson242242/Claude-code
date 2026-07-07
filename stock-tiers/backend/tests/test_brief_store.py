"""Brief store: one-per-day replace, newest-first ordering, pruning."""

from __future__ import annotations

from pathlib import Path

from app.schemas import DISCLAIMER, DailyBrief
from app.store.brief_store import BriefStore


def _brief(brief_id: str, title: str = "t") -> DailyBrief:
    return DailyBrief(
        id=brief_id,
        title=title,
        date=brief_id,
        script="……",
        highlights=[],
        swing_theses=[],
        audio_url=f"/api/briefs/audio/brief-{brief_id}.mp3",
        generated_at=f"{brief_id}T12:00:00+00:00",
        disclaimer=DISCLAIMER,
    )


async def test_same_day_rerun_replaces(tmp_path: Path) -> None:
    store = BriefStore(tmp_path, keep=5)
    await store.save(_brief("2026-07-07", title="first"))
    await store.save(_brief("2026-07-07", title="second"))
    briefs = await store.list_briefs()
    assert len(briefs) == 1
    assert briefs[0].title == "second"


async def test_newest_first_and_prune_deletes_audio(tmp_path: Path) -> None:
    store = BriefStore(tmp_path, keep=2)
    for day in ("2026-07-05", "2026-07-06", "2026-07-07"):
        store.audio_path(day).parent.mkdir(parents=True, exist_ok=True)
        store.audio_path(day).write_bytes(b"ID3x")
        await store.save(_brief(day))

    briefs = await store.list_briefs()
    assert [b.id for b in briefs] == ["2026-07-07", "2026-07-06"]  # newest first, pruned
    assert not store.audio_path("2026-07-05").exists()  # pruned mp3 removed
    assert store.audio_path("2026-07-07").exists()

    latest = await store.latest()
    assert latest is not None and latest.id == "2026-07-07"
    assert await store.get("2026-07-06") is not None
    assert await store.get("2026-07-05") is None
