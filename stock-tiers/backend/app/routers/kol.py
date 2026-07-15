"""X KOL tracker routes: daily scan loop + scoreboard reads."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.config import get_settings
from app.deps import get_kol_engine, get_kol_store, get_raw_provider
from app.errors import AppError
from app.providers.base import StockDataProvider
from app.schemas import DISCLAIMER, KolCall, KolPost, KolReport
from app.services.kol_engine import (
    MAX_CALLS,
    MAX_POSTS,
    KolEngine,
    compute_scoreboard,
    reprice_calls,
)
from app.store.kol_store import KolStore

router = APIRouter(prefix="/api/kol", tags=["kol"])

_RECENT_POSTS = 30


def _report(
    handle: str,
    *,
    summary: str,
    posts: list[KolPost],
    calls: list[KolCall],
) -> KolReport:
    return KolReport(
        handle=handle,
        summary=summary,
        scoreboard=compute_scoreboard(handle, posts, calls),
        recent_posts=posts[:_RECENT_POSTS],
        calls=calls,
        generated_at=datetime.now(UTC).isoformat(),
        disclaimer=DISCLAIMER,
    )


@router.post("/run", response_model=list[KolReport])
async def run_kol_scan(
    store: KolStore = Depends(get_kol_store),
    engine: KolEngine = Depends(get_kol_engine),
    x_cron_secret: Annotated[str | None, Header()] = None,
) -> list[KolReport]:
    """Daily loop (Render Cron): for each handle in KOL_HANDLES — find new
    posts, classify gain/loss claims, freeze entry prices for new calls, and
    reprice every tracked call against live market data."""
    settings = get_settings()
    if settings.cron_secret and x_cron_secret != settings.cron_secret:
        raise AppError("Bad or missing x-cron-secret", type="unauthorized", status=401)

    reports: list[KolReport] = []
    now = datetime.now(UTC).isoformat()
    for handle in settings.kol_handle_list():
        state = await store.get_state(handle)
        summary, new_posts, raw_calls = await engine.scan(handle=handle, known_posts=state.posts)
        frozen = await engine.freeze_new_calls(raw_calls, state.calls)

        posts = (new_posts + state.posts)[:MAX_POSTS]  # newest first
        calls = await engine.reprice_calls((frozen + state.calls)[:MAX_CALLS])

        await store.save_state(handle, posts=posts, calls=calls, summary=summary, updated_at=now)
        reports.append(_report(handle, summary=summary, posts=posts, calls=calls))
    return reports


@router.get("", response_model=list[KolReport])
async def get_kol_reports(
    store: KolStore = Depends(get_kol_store),
    provider: StockDataProvider = Depends(get_raw_provider),
) -> list[KolReport]:
    """Current scoreboards (reprices tracked calls with live quotes; no scan,
    no Claude needed — works even without ANTHROPIC_API_KEY)."""
    reports: list[KolReport] = []
    for handle in get_settings().kol_handle_list():
        state = await store.get_state(handle)
        if state.updated_at is None:
            reports.append(
                _report(handle, summary="还没有扫描过——先运行一次每日扫描。", posts=[], calls=[])
            )
            continue
        calls = await reprice_calls(provider, state.calls)
        reports.append(_report(handle, summary=state.summary, posts=state.posts, calls=calls))
    return reports
