"""Meta endpoints: report which providers are live, and probe the real one.

These exist so you can tell **real** data from a silent mock fallback: the
resilient wrapper degrades to mock on any upstream error, so a green screener
alone doesn't prove Finnhub is actually reachable. /stock-probe calls the bare
primary provider once (bypassing the resilient + cached wrappers).
"""

from __future__ import annotations

from typing import Any

import anthropic
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
    settings = get_settings()
    is_real = bool(getattr(request.app.state, "stock_is_real", False))
    engine, model = _tier_engine_mode()
    return {
        "stock": "finnhub" if is_real else "mock",
        "tierEngine": engine,
        "model": model,
        # Diagnostics so misconfig is obvious without exposing secrets:
        # if stock=="mock" check these — STOCK_PROVIDER must be "finnhub" AND
        # finnhubKeyPresent must be true.
        "stockProviderSetting": settings.stock_provider,
        "finnhubKeyPresent": bool(settings.finnhub_api_key),
        "anthropicKeyPresent": bool(settings.anthropic_api_key),
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


@router.get("/tier-probe")
async def tier_probe() -> dict[str, Any]:
    """Minimal Claude call to diagnose the tier engine (auth / credits / model).

    ok:true  -> Claude is reachable; if a tier list still fails it's the request
                shape, not the key. ok:false -> the error explains why (e.g. a
                401 auth error, a 400 'credit balance too low', or model access).
    """
    settings = get_settings()
    if not settings.anthropic_api_key:
        return {"ok": False, "error": "ANTHROPIC_API_KEY not set"}
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    try:
        await client.messages.create(
            model=settings.tier_model,
            max_tokens=16,
            messages=[{"role": "user", "content": "ping"}],
        )
    except Exception as exc:
        return {"ok": False, "model": settings.tier_model, "error": f"{type(exc).__name__}: {exc}"}
    return {"ok": True, "model": settings.tier_model}


@router.get("/tier-debug")
async def tier_debug(request: Request, ticker: str = "PWR") -> dict[str, Any]:
    """Run a real tier generation and report entry counts so an empty tier list
    can be diagnosed: did Claude return few entries (stopReason/max_tokens) or did
    market-data validation drop them?"""
    settings = get_settings()
    if not settings.anthropic_api_key:
        return {"ok": False, "error": "ANTHROPIC_API_KEY not set"}
    # Imported here to avoid a heavy import on the hot path.
    from app.services.tier_engine import TierEngine

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    engine = TierEngine(
        client=client,
        provider=request.app.state.raw_primary,
        cache=request.app.state.tier_cache,
        settings=settings,
    )
    try:
        return {"ok": True, **(await engine.generate_debug(ticker))}
    except Exception as exc:
        return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
