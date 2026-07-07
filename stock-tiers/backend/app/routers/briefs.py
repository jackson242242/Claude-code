"""Daily audio brief: generation loop, listing, audio files, podcast RSS."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request, Response
from fastapi.responses import FileResponse

from app.config import get_settings
from app.deps import get_brief_engine, get_brief_store, get_portfolio_store
from app.errors import AppError
from app.schemas import BriefSummary, DailyBrief
from app.services.brief_engine import BriefEngine
from app.services.podcast_feed import build_podcast_feed
from app.services.podcast_scanner import PodcastScanner
from app.services.tts import synthesize_to_mp3
from app.store.brief_store import BriefStore
from app.store.portfolio_store import PortfolioStore

router = APIRouter(prefix="/api/briefs", tags=["briefs"])
feed_router = APIRouter(tags=["briefs"])


@router.post("/run", response_model=DailyBrief)
async def run_brief(
    store: BriefStore = Depends(get_brief_store),
    portfolio: PortfolioStore = Depends(get_portfolio_store),
    engine: BriefEngine = Depends(get_brief_engine),
    x_cron_secret: Annotated[str | None, Header()] = None,
) -> DailyBrief:
    """Generate today's brief now (the daily Render Cron job hits this too):
    scan podcasts -> Claude + web search -> spoken script -> TTS mp3 -> store.

    If CRON_SECRET is set, the x-cron-secret header must match.
    """
    settings = get_settings()
    if settings.cron_secret and x_cron_secret != settings.cron_secret:
        raise AppError("Bad or missing x-cron-secret", type="unauthorized", status=401)

    today = datetime.now(UTC).date().isoformat()
    positions = await portfolio.list_positions()
    trends = await portfolio.list_trends()
    episodes = await PodcastScanner(settings).fetch_recent_episodes()

    brief = await engine.generate(
        date=today,
        holdings=[f"{p.ticker}({p.trend})" if p.trend else p.ticker for p in positions],
        trends=[t.name for t in trends],
        podcast_episodes=episodes,
    )

    # TTS is best-effort: a failure ships the text-only brief, never a 500.
    audio_path = store.audio_path(brief.id)
    if await synthesize_to_mp3(brief.script, voice=settings.tts_voice, out_path=audio_path):
        brief.audio_url = f"/api/briefs/audio/brief-{brief.id}.mp3"

    await store.save(brief)
    return brief


@router.get("/latest", response_model=DailyBrief)
async def latest_brief(store: BriefStore = Depends(get_brief_store)) -> DailyBrief:
    brief = await store.latest()
    if brief is None:
        raise AppError("No brief yet — run one first", type="not_found", status=404)
    return brief


@router.get("", response_model=list[BriefSummary])
async def list_briefs(store: BriefStore = Depends(get_brief_store)) -> list[BriefSummary]:
    return [
        BriefSummary(
            id=b.id,
            title=b.title,
            date=b.date,
            audio_url=b.audio_url,
            generated_at=b.generated_at,
        )
        for b in await store.list_briefs()
    ]


@router.get("/audio/brief-{brief_id}.mp3")
async def brief_audio(
    brief_id: str,
    store: BriefStore = Depends(get_brief_store),
) -> FileResponse:
    # Look the id up in the store (never trust the raw path segment).
    brief = await store.get(brief_id)
    path = store.audio_path(brief_id)
    if brief is None or brief.audio_url is None or not path.is_file():
        raise AppError("No audio for that brief", type="not_found", status=404)
    return FileResponse(path, media_type="audio/mpeg", filename=path.name)


@feed_router.get("/podcast.xml")
async def podcast_feed(
    request: Request,
    store: BriefStore = Depends(get_brief_store),
) -> Response:
    """Podcast RSS — submit this URL to Spotify for Creators (or add it as a
    private feed in Apple Podcasts / Pocket Casts)."""
    settings = get_settings()
    base_url = settings.public_base_url or str(request.base_url)
    xml = build_podcast_feed(await store.list_briefs(), base_url=base_url)
    return Response(content=xml, media_type="application/rss+xml")
