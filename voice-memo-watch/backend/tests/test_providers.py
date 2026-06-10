from __future__ import annotations

import wave
from pathlib import Path

import pytest

from app.providers.mock_music import MockMusicProvider
from app.providers.registry import music_provider
from app.providers.replicate_musicgen import ReplicateMusicGenProvider, _prompt_for
from app.schemas import RenderRequest, Tweaks
from tests.conftest import make_wav


def _write_wav(path: Path) -> None:
    path.write_bytes(make_wav())


def _spec(style: str = "lofi", **kwargs) -> RenderRequest:
    return RenderRequest(style=style, **kwargs)


def test_mock_lofi_slows_framerate_and_adds_echo(tmp_path: Path) -> None:
    source, out = tmp_path / "in.wav", tmp_path / "out.wav"
    _write_wav(source)
    MockMusicProvider().render(source, out, _spec("lofi"))
    with wave.open(str(source)) as a, wave.open(str(out)) as b:
        assert b.getframerate() < a.getframerate()
        assert a.readframes(a.getnframes()) != b.readframes(b.getnframes())


def test_mock_acoustic_attenuates(tmp_path: Path) -> None:
    source, out = tmp_path / "in.wav", tmp_path / "out.wav"
    _write_wav(source)
    MockMusicProvider().render(source, out, _spec("acoustic"))
    with wave.open(str(out)) as b:
        assert b.getframerate() == 8000  # no tempo change for acoustic


def test_mock_applies_speed_and_reverse_tweaks(tmp_path: Path) -> None:
    source, out = tmp_path / "in.wav", tmp_path / "out.wav"
    _write_wav(source)
    MockMusicProvider().render(
        source, out, _spec("acoustic", tweaks=Tweaks(speed=2.0, reverse=True))
    )
    with wave.open(str(source)) as a, wave.open(str(out)) as b:
        assert b.getframerate() == a.getframerate() * 2
        original = a.readframes(a.getnframes())
        reversed_frames = b.readframes(b.getnframes())
        assert len(original) == len(reversed_frames)
        assert original != reversed_frames


def test_mock_tweak_echo_changes_samples(tmp_path: Path) -> None:
    source, plain, echoed = tmp_path / "in.wav", tmp_path / "a.wav", tmp_path / "b.wav"
    _write_wav(source)
    provider = MockMusicProvider()
    provider.render(source, plain, _spec("acoustic"))
    provider.render(source, echoed, _spec("acoustic", tweaks=Tweaks(echo=0.8)))
    assert plain.read_bytes() != echoed.read_bytes()


def test_mock_instruments_add_audible_layers(tmp_path: Path) -> None:
    source = tmp_path / "in.wav"
    _write_wav(source)
    provider = MockMusicProvider()
    outputs = {}
    for name, instruments in {
        "plain": [],
        "piano": ["piano"],
        "band": ["piano", "strings", "drums"],
    }.items():
        out = tmp_path / f"{name}.wav"
        provider.render(source, out, _spec("acoustic", instruments=instruments))
        outputs[name] = out.read_bytes()
    assert outputs["plain"] != outputs["piano"]
    assert outputs["piano"] != outputs["band"]
    # layers mix into the same duration, not append
    with wave.open(str(tmp_path / "band.wav")) as b, wave.open(str(source)) as a:
        assert b.getnframes() == a.getnframes()


def test_mock_prompt_keywords_drive_dsp(tmp_path: Path) -> None:
    source = tmp_path / "in.wav"
    _write_wav(source)
    provider = MockMusicProvider()

    deep = tmp_path / "deep.wav"
    provider.render(
        source, deep, _spec("acoustic", prompt="a demon villain talks")
    )
    with wave.open(str(deep)) as b:
        assert b.getframerate() < 8000  # "demon" lowers pitch/speed

    whisper, plain = tmp_path / "whisper.wav", tmp_path / "plain.wav"
    provider.render(source, plain, _spec("acoustic"))
    provider.render(source, whisper, _spec("acoustic", prompt="a tired sigh"))
    assert whisper.read_bytes() != plain.read_bytes()

    robot = tmp_path / "robot.wav"
    provider.render(source, robot, _spec("acoustic", prompt="robot voice"))
    assert robot.read_bytes() != plain.read_bytes()

    # unknown words are ignored, not errors
    noop = tmp_path / "noop.wav"
    provider.render(source, noop, _spec("acoustic", prompt="zzz qqq"))
    assert noop.read_bytes() == plain.read_bytes()


def test_mock_passes_through_non_wav(tmp_path: Path) -> None:
    source, out = tmp_path / "memo.m4a", tmp_path / "out.m4a"
    source.write_bytes(b"\x00\x00\x00\x20ftypM4A fake-aac-payload")
    MockMusicProvider().render(source, out, _spec("edm"))
    assert out.read_bytes() == source.read_bytes()


def test_registry_defaults_to_mock(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("REPLICATE_API_TOKEN", raising=False)
    assert isinstance(music_provider(), MockMusicProvider)
    monkeypatch.setenv("REPLICATE_API_TOKEN", "r8_test")
    assert isinstance(music_provider(), ReplicateMusicGenProvider)


class _FakeResponse:
    def __init__(self, json_data=None, content: bytes = b"") -> None:
        self._json = json_data
        self.content = content

    def raise_for_status(self) -> None:
        pass

    def json(self):
        return self._json


class _FakeClient:
    """Simulates the Replicate prediction lifecycle without the network."""

    def __init__(self) -> None:
        self.polls = 0

    def post(self, url: str, json: dict) -> _FakeResponse:
        assert "melody" in json["input"]
        return _FakeResponse(
            {"status": "processing", "urls": {"get": "https://x/p/1"}}
        )

    def get(self, url: str) -> _FakeResponse:
        if url.endswith("/p/1"):
            self.polls += 1
            return _FakeResponse(
                {
                    "status": "succeeded",
                    "urls": {"get": url},
                    "output": "https://x/audio.wav",
                }
            )
        return _FakeResponse(content=b"generated-music")


def test_replicate_provider_polls_and_downloads(tmp_path: Path) -> None:
    source, out = tmp_path / "in.wav", tmp_path / "out.wav"
    _write_wav(source)
    provider = ReplicateMusicGenProvider(
        "r8_test", client=_FakeClient(), poll_interval=0.0
    )
    provider.render(source, out, _spec("edm"))
    assert out.read_bytes() == b"generated-music"


def test_replicate_spec_becomes_prompt_conditioning() -> None:
    prompt = _prompt_for(
        _spec(
            "edm",
            tweaks=Tweaks(speed=1.5, echo=0.5, reverse=True),
            instruments=["piano", "strings"],
            prompt="an anime villain talking",
        )
    )
    assert "fast tempo" in prompt
    assert "echo" in prompt
    assert "reversed" in prompt
    assert "featuring piano and strings" in prompt
    assert "an anime villain talking" in prompt
    assert _prompt_for(_spec("edm")) == _prompt_for(
        _spec("edm", tweaks=Tweaks(volume=2.0))
    )


def test_replicate_provider_raises_on_failure(tmp_path: Path) -> None:
    source, out = tmp_path / "in.wav", tmp_path / "out.wav"
    _write_wav(source)

    class FailingClient(_FakeClient):
        def post(self, url: str, json: dict) -> _FakeResponse:
            return _FakeResponse({"status": "failed", "urls": {"get": "https://x/p/1"}})

    provider = ReplicateMusicGenProvider(
        "r8_test", client=FailingClient(), poll_interval=0.0
    )
    with pytest.raises(RuntimeError):
        provider.render(source, out, _spec("edm"))
