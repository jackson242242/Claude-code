"""JSON-file persistence for the X KOL tracker (per-handle posts + calls)."""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

from app.schemas import KolCall, KolPost


class KolState:
    def __init__(
        self,
        posts: list[KolPost],
        calls: list[KolCall],
        summary: str,
        updated_at: str | None,
    ) -> None:
        self.posts = posts
        self.calls = calls
        self.summary = summary
        self.updated_at = updated_at


class KolStore:
    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = asyncio.Lock()

    def _read(self) -> dict[str, Any]:
        try:
            data: dict[str, Any] = json.loads(self._path.read_text(encoding="utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            data = {}
        data.setdefault("handles", {})
        return data

    def _write(self, data: dict[str, Any]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._path.with_suffix(".tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, self._path)

    async def get_state(self, handle: str) -> KolState:
        async with self._lock:
            raw = self._read()["handles"].get(handle.lower(), {})
            return KolState(
                posts=[KolPost.model_validate(p) for p in raw.get("posts", [])],
                calls=[KolCall.model_validate(c) for c in raw.get("calls", [])],
                summary=str(raw.get("summary", "")),
                updated_at=raw.get("updatedAt"),
            )

    async def save_state(
        self,
        handle: str,
        *,
        posts: list[KolPost],
        calls: list[KolCall],
        summary: str,
        updated_at: str,
    ) -> None:
        async with self._lock:
            data = self._read()
            data["handles"][handle.lower()] = {
                "posts": [p.model_dump(by_alias=True) for p in posts],
                "calls": [c.model_dump(by_alias=True) for c in calls],
                "summary": summary,
                "updatedAt": updated_at,
            }
            self._write(data)
