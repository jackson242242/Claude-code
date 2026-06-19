"""Shared protocol for tier-list engines (real Claude + deterministic mock)."""

from __future__ import annotations

from typing import Protocol

from app.schemas import TierList


class TierEngineProtocol(Protocol):
    async def generate(self, hot_stock_ticker: str) -> TierList: ...
