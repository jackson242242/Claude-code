"""Trend discovery loop: dedupe against tracked trends, field normalization."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from app.config import Settings
from app.services.trend_engine import TrendEngine, anchor_trend, trend_id


class _FakeToolUseBlock:
    def __init__(self, name: str, payload: dict[str, Any]) -> None:
        self.type = "tool_use"
        self.name = name
        self.input = payload


class _FakeMessages:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload
        self.calls = 0
        self.last_kwargs: dict[str, Any] = {}

    async def create(self, **kwargs: Any) -> SimpleNamespace:
        self.calls += 1
        self.last_kwargs = kwargs
        block = _FakeToolUseBlock("emit_trends", self._payload)
        return SimpleNamespace(content=[block])


class _FakeAnthropic:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.messages = _FakeMessages(payload)


_PAYLOAD = {
    "trends": [
        {
            # Duplicates the tracked anchor -> must be dropped by the loop.
            "name": "AI 平台迁移",
            "category": "科技",
            "thesis": "AI 是十年平台迁移",
            "whyNow": "已在跟踪",
            "horizon": "long",
        },
        {
            "name": "电网升级",
            "category": "能源",
            "thesis": "电力需求加速,电网设备必须扩容",
            "whyNow": "多年来用电量首次加速增长",
            "horizon": "long",
        },
        {
            "name": "国防重建",
            "category": "地缘政治",
            "thesis": "各国国防预算进入多年上行周期",
            "whyNow": "多国上调国防开支占 GDP 目标",
            "horizon": "bogus-horizon",  # invalid -> normalized to "long"
        },
        {
            # Missing thesis -> dropped.
            "name": "空趋势",
            "category": "其他",
            "thesis": "  ",
            "whyNow": "n/a",
            "horizon": "long",
        },
    ]
}


def _engine(payload: dict[str, Any]) -> TrendEngine:
    settings = Settings(stock_provider="mock", anthropic_api_key="test")
    return TrendEngine(client=_FakeAnthropic(payload), settings=settings)  # type: ignore[arg-type]


async def test_discover_dedupes_and_normalizes() -> None:
    engine = _engine(_PAYLOAD)
    known = [anchor_trend()]
    trends = await engine.discover(known, count=3)
    names = [t.name for t in trends]
    assert names == ["电网升级", "国防重建"]  # anchor dupe + empty thesis dropped
    assert trends[0].id == trend_id("电网升级")
    assert trends[1].horizon == "long"  # invalid horizon normalized


async def test_discover_prompt_lists_known_trends() -> None:
    engine = _engine(_PAYLOAD)
    await engine.discover([anchor_trend()], count=2)
    fake = engine._client.messages  # type: ignore[attr-defined]
    user_message = fake.last_kwargs["messages"][0]["content"]
    assert "AI 平台迁移" in user_message  # the loop feeds tracked trends back in
    assert "exactly 2" in user_message
