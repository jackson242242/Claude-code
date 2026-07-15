"""JSON-file persistence for daily briefs + their mp3 files.

Same conventions as PortfolioStore: camelCase JSON, atomic writes, asyncio
lock. One brief per date (a rerun replaces that date). Old briefs and their
audio files are pruned beyond `keep` entries.
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

from app.schemas import DailyBrief


class BriefStore:
    def __init__(self, base_dir: Path, *, keep: int = 14) -> None:
        self._path = base_dir / "briefs.json"
        self.audio_dir = base_dir / "audio"
        self._keep = keep
        self._lock = asyncio.Lock()

    def audio_path(self, brief_id: str) -> Path:
        return self.audio_dir / f"brief-{brief_id}.mp3"

    # -- raw file I/O ---------------------------------------------------------

    def _read(self) -> list[dict[str, Any]]:
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            return list(data) if isinstance(data, list) else []
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _write(self, briefs: list[dict[str, Any]]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._path.with_suffix(".tmp")
        tmp.write_text(json.dumps(briefs, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, self._path)

    # -- operations -----------------------------------------------------------

    async def save(self, brief: DailyBrief) -> None:
        async with self._lock:
            briefs = [b for b in self._read() if str(b.get("id")) != brief.id]
            briefs.append(brief.model_dump(by_alias=True))
            briefs.sort(key=lambda b: str(b.get("date", "")), reverse=True)
            for stale in briefs[self._keep :]:
                self.audio_path(str(stale.get("id", ""))).unlink(missing_ok=True)
            self._write(briefs[: self._keep])

    async def list_briefs(self) -> list[DailyBrief]:
        """Newest first."""
        async with self._lock:
            return [DailyBrief.model_validate(b) for b in self._read()]

    async def latest(self) -> DailyBrief | None:
        briefs = await self.list_briefs()
        return briefs[0] if briefs else None

    async def get(self, brief_id: str) -> DailyBrief | None:
        for brief in await self.list_briefs():
            if brief.id == brief_id:
                return brief
        return None
