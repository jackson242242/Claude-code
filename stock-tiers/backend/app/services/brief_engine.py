"""Daily brief engine: one Claude + web-search pass -> structured brief."""

from __future__ import annotations

from datetime import UTC, datetime

import anthropic

from app.config import Settings
from app.schemas import DISCLAIMER, BriefHighlight, DailyBrief, Horizon, SwingThesis
from app.services.brief_prompt import BRIEF_SYSTEM_PROMPT, BRIEF_TOOL, build_brief_message
from app.services.claude_runner import call_claude_tool

_VALID_TOPICS = {"股市", "金融宏观", "地缘政治", "播客观点"}
_VALID_HORIZONS = {"short", "medium", "long"}


class BriefEngine:
    def __init__(self, client: anthropic.AsyncAnthropic, settings: Settings) -> None:
        self._client = client
        self._settings = settings

    async def generate(
        self,
        *,
        date: str,
        holdings: list[str],
        trends: list[str],
        podcast_episodes: list[str],
    ) -> DailyBrief:
        message = build_brief_message(
            date=date,
            holdings=holdings,
            trends=trends,
            podcast_episodes=podcast_episodes,
        )
        raw, _stop = await call_claude_tool(
            self._client,
            self._settings,
            system_prompt=BRIEF_SYSTEM_PROMPT,
            user_message=message,
            emit_tool=BRIEF_TOOL,
        )

        highlights: list[BriefHighlight] = []
        for item in raw.get("highlights", []):
            if not isinstance(item, dict) or item.get("topic") not in _VALID_TOPICS:
                continue
            headline = str(item.get("headline", "")).strip()
            if not headline:
                continue
            highlights.append(
                BriefHighlight(
                    topic=item["topic"],
                    headline=headline,
                    detail=str(item.get("detail", "")).strip(),
                )
            )

        theses: list[SwingThesis] = []
        for item in raw.get("swingTheses", []):
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()
            thesis = str(item.get("thesis", "")).strip()
            if not name or not thesis:
                continue
            horizon_raw = str(item.get("horizon", "short"))
            horizon: Horizon = (
                horizon_raw if horizon_raw in _VALID_HORIZONS else "short"  # type: ignore[assignment]
            )
            theses.append(
                SwingThesis(
                    name=name,
                    thesis=thesis,
                    horizon=horizon,
                    why_now=str(item.get("whyNow", "")).strip(),
                )
            )

        return DailyBrief(
            id=date,
            title=str(raw.get("title", "")).strip() or f"{date} 每日简报",
            date=date,
            script=str(raw.get("script", "")).strip(),
            highlights=highlights,
            swing_theses=theses,
            audio_url=None,  # filled in by the route after TTS
            generated_at=datetime.now(UTC).isoformat(),
            disclaimer=DISCLAIMER,
        )
