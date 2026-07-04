"""JSON-file persistence for the portfolio, secular trends, and daily research.

One file, camelCase JSON (same shape as the wire contract), atomic replace
writes, an asyncio lock around read-modify-write. Deliberately simple for the
MVP — swap for a real DB when multi-user. Note: on hosts with ephemeral disks
(e.g. Render free tier) the file resets on redeploy; attach a persistent disk
or accept re-adding picks.
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

from app.errors import AppError
from app.schemas import PortfolioPosition, ResearchReport, SecularTrend


class PortfolioStore:
    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = asyncio.Lock()

    # -- raw file I/O ---------------------------------------------------------

    def _read(self) -> dict[str, Any]:
        try:
            data: dict[str, Any] = json.loads(self._path.read_text(encoding="utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            data = {}
        data.setdefault("positions", [])
        data.setdefault("trends", [])
        data.setdefault("research", None)
        return data

    def _write(self, data: dict[str, Any]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._path.with_suffix(".tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, self._path)  # atomic on POSIX

    # -- positions ------------------------------------------------------------

    async def list_positions(self) -> list[PortfolioPosition]:
        async with self._lock:
            return [PortfolioPosition.model_validate(p) for p in self._read()["positions"]]

    async def add_position(self, position: PortfolioPosition) -> None:
        async with self._lock:
            data = self._read()
            tickers = {str(p.get("ticker", "")).upper() for p in data["positions"]}
            if position.ticker.upper() in tickers:
                raise AppError(
                    f"{position.ticker} is already in the portfolio",
                    type="conflict",
                    status=409,
                )
            data["positions"].append(position.model_dump(by_alias=True))
            self._write(data)

    async def remove_position(self, ticker: str) -> bool:
        wanted = ticker.upper()
        async with self._lock:
            data = self._read()
            before = len(data["positions"])
            data["positions"] = [
                p for p in data["positions"] if str(p.get("ticker", "")).upper() != wanted
            ]
            if len(data["positions"]) == before:
                return False
            self._write(data)
            return True

    # -- secular trends ---------------------------------------------------------

    async def list_trends(self) -> list[SecularTrend]:
        async with self._lock:
            return [SecularTrend.model_validate(t) for t in self._read()["trends"]]

    async def add_trends(self, trends: list[SecularTrend]) -> list[SecularTrend]:
        """Append new trends (dedup by id), returning the full stored list."""
        async with self._lock:
            data = self._read()
            known = {str(t.get("id", "")) for t in data["trends"]}
            for trend in trends:
                if trend.id in known:
                    continue
                known.add(trend.id)
                data["trends"].append(trend.model_dump(by_alias=True))
            self._write(data)
            return [SecularTrend.model_validate(t) for t in data["trends"]]

    # -- daily research ---------------------------------------------------------

    async def get_research(self) -> ResearchReport | None:
        async with self._lock:
            raw = self._read()["research"]
            return ResearchReport.model_validate(raw) if raw is not None else None

    async def set_research(self, report: ResearchReport) -> None:
        async with self._lock:
            data = self._read()
            data["research"] = report.model_dump(by_alias=True)
            self._write(data)
