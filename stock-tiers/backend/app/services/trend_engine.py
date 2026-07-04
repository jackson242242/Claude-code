"""Secular-trend discovery engine (the diversification loop).

Every run feeds the trends we already track back into the prompt and asks for
NEW directions from different drivers, so repeated runs progressively cover
more independent secular trends. Each trend's `thesis` is written in the same
shape a user types on the home screen, so it plugs straight into the existing
thesis -> tier pipeline.
"""

from __future__ import annotations

from datetime import UTC, datetime

import anthropic

from app.config import Settings
from app.schemas import Horizon, SecularTrend
from app.services.claude_runner import call_claude_tool
from app.services.trend_prompt import TREND_SYSTEM_PROMPT, TREND_TOOL, build_trend_message

_VALID_HORIZONS: set[str] = {"short", "medium", "long"}

# The app's founding thesis — seeded as trend #1 so the discovery loop always
# knows the AI direction is covered and must branch elsewhere.
_ANCHOR_NAME = "AI 平台迁移"


def trend_id(name: str) -> str:
    """Identity key for dedup: whitespace-stripped, casefolded name."""
    return "".join(name.split()).casefold()


def anchor_trend() -> SecularTrend:
    return SecularTrend(
        id=trend_id(_ANCHOR_NAME),
        name=_ANCHOR_NAME,
        category="科技",
        thesis=(
            "AI 是一次十年级别的平台迁移(类似智能手机浪潮):算力、模型、应用、"
            "生态逐层扩散,会像苹果供应链一样带出整条产业链的公开公司。"
        ),
        why_now="本应用的立项锚点;大模型与算力资本开支仍在加速。",
        horizon="long",
        discovered_at=datetime.now(UTC).isoformat(),
    )


class TrendEngine:
    def __init__(self, client: anthropic.AsyncAnthropic, settings: Settings) -> None:
        self._client = client
        self._settings = settings

    async def discover(self, known: list[SecularTrend], count: int) -> list[SecularTrend]:
        """Propose `count` NEW trends, deduped against `known` (and each other)."""
        message = build_trend_message(
            known=[f"{t.name}({t.category}): {t.thesis}" for t in known],
            count=count,
        )
        raw, _stop = await call_claude_tool(
            self._client,
            self._settings,
            system_prompt=TREND_SYSTEM_PROMPT,
            user_message=message,
            emit_tool=TREND_TOOL,
        )

        seen = {t.id for t in known}
        now = datetime.now(UTC).isoformat()
        out: list[SecularTrend] = []
        for item in raw.get("trends", []):
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()
            thesis = str(item.get("thesis", "")).strip()
            if not name or not thesis:
                continue
            tid = trend_id(name)
            if tid in seen:
                continue  # the loop must not re-propose a tracked trend
            seen.add(tid)
            horizon_raw = str(item.get("horizon", "long"))
            horizon: Horizon = (
                horizon_raw if horizon_raw in _VALID_HORIZONS else "long"  # type: ignore[assignment]
            )
            out.append(
                SecularTrend(
                    id=tid,
                    name=name,
                    category=str(item.get("category", "")).strip() or "其他",
                    thesis=thesis,
                    why_now=str(item.get("whyNow", "")).strip(),
                    horizon=horizon,
                    discovered_at=now,
                )
            )
        return out
