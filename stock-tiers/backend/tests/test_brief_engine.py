"""Brief engine: validation/normalization of Claude's structured brief."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from app.config import Settings
from app.services.brief_engine import BriefEngine


class _FakeToolUseBlock:
    def __init__(self, name: str, payload: dict[str, Any]) -> None:
        self.type = "tool_use"
        self.name = name
        self.input = payload


class _FakeMessages:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload
        self.last_kwargs: dict[str, Any] = {}

    async def create(self, **kwargs: Any) -> SimpleNamespace:
        self.last_kwargs = kwargs
        return SimpleNamespace(content=[_FakeToolUseBlock("emit_brief", self._payload)])


class _FakeAnthropic:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.messages = _FakeMessages(payload)


_PAYLOAD = {
    "title": "7月7日:关税与算力",
    "script": "今天是七月七号。市场整体走高……(免责声明:内容仅供研究参考。)",
    "highlights": [
        {"topic": "股市", "headline": "半导体领涨", "detail": "财报预期抬升。"},
        {"topic": "播客观点", "headline": "某大佬看多电力", "detail": "在 BG2 访谈中提到。"},
        {"topic": "不存在的栏目", "headline": "应被丢弃", "detail": ""},
        {"topic": "股市", "headline": "", "detail": "空标题应被丢弃"},
    ],
    "swingTheses": [
        {
            "name": "电力设备补库存",
            "thesis": "数据中心建设推动电网设备订单",
            "horizon": "short",
            "whyNow": "多家公司上调指引",
        },
        {"name": "", "thesis": "无名应被丢弃", "horizon": "short", "whyNow": ""},
        {
            "name": "坏周期",
            "thesis": "无效 horizon 应归一化",
            "horizon": "yolo",
            "whyNow": "",
        },
    ],
}


def _engine(payload: dict[str, Any]) -> BriefEngine:
    settings = Settings(stock_provider="mock", anthropic_api_key="test")
    return BriefEngine(client=_FakeAnthropic(payload), settings=settings)  # type: ignore[arg-type]


async def test_generate_validates_and_normalizes() -> None:
    engine = _engine(_PAYLOAD)
    brief = await engine.generate(
        date="2026-07-07",
        holdings=["NVDA(AI 平台迁移)"],
        trends=["AI 平台迁移"],
        podcast_episodes=["BG2 Pod — 某期 (2026-07-06): 讨论了电力瓶颈"],
    )
    assert brief.id == "2026-07-07"
    assert brief.title == "7月7日:关税与算力"
    assert brief.audio_url is None  # TTS happens at the route layer
    assert [h.headline for h in brief.highlights] == ["半导体领涨", "某大佬看多电力"]
    assert [t.name for t in brief.swing_theses] == ["电力设备补库存", "坏周期"]
    assert brief.swing_theses[1].horizon == "short"  # invalid horizon normalized
    assert "not financial advice" in brief.disclaimer.lower()


async def test_prompt_carries_context() -> None:
    engine = _engine(_PAYLOAD)
    await engine.generate(
        date="2026-07-07",
        holdings=["NVDA"],
        trends=["电网升级"],
        podcast_episodes=["Odd Lots — 关税专题 (2026-07-06): ..."],
    )
    fake = engine._client.messages  # type: ignore[attr-defined]
    message = fake.last_kwargs["messages"][0]["content"]
    assert "2026-07-07" in message
    assert "NVDA" in message
    assert "电网升级" in message
    assert "Odd Lots" in message  # podcast scan feeds the prompt
