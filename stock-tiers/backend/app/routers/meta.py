"""Meta endpoints: report which providers are live, and probe the real one.

These exist so you can tell **real** data from a silent mock fallback: the
resilient wrapper degrades to mock on any upstream error, so a green screener
alone doesn't prove Finnhub is actually reachable. /stock-probe calls the bare
primary provider once (bypassing the resilient + cached wrappers).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from app.config import get_settings
from app.providers.base import StockDataProvider

router = APIRouter(prefix="/api/meta", tags=["meta"])

_PROBE_TICKER = "NVDA"


def _tier_engine_mode() -> tuple[str, str | None]:
    settings = get_settings()
    use_claude = settings.tier_provider == "claude" or (
        settings.tier_provider == "auto" and bool(settings.anthropic_api_key)
    )
    return ("claude", settings.tier_model) if use_claude else ("mock", None)


@router.get("/providers")
async def providers(request: Request) -> dict[str, Any]:
    is_real = bool(getattr(request.app.state, "stock_is_real", False))
    engine, model = _tier_engine_mode()
    return {
        "stock": "finnhub" if is_real else "mock",
        "tierEngine": engine,
        "model": model,
    }


@router.get("/stock-probe")
async def stock_probe(request: Request) -> dict[str, Any]:
    is_real = bool(getattr(request.app.state, "stock_is_real", False))
    provider: StockDataProvider = request.app.state.raw_primary
    name = "finnhub" if is_real else "mock"
    try:
        detail = await provider.get_quote(_PROBE_TICKER)
    except Exception as exc:  # report the failure, never fall back here
        return {"ok": False, "provider": name, "error": str(exc)}
    return {"ok": True, "provider": name, "ticker": detail.ticker, "price": detail.price}
