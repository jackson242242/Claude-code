from __future__ import annotations

import wave
from pathlib import Path

import pytest

from app.providers.mock_music import MockMusicProvider
from app.providers.registry import music_provider
from app.providers.replicate_musicgen import ReplicateMusicGenProvider
from tests.conftest import make_wav


def _write_wav(path: Path) -> None:
    path.write_bytes(make_wav())


def test_mock_lofi_slows_framerate_and_adds_echo(tmp_path: Path) -> None:
    source, out = tmp_path / "in.wav", tmp_path / "out.wav"
    _write_wav(source)
    MockMusicProvider().render(source, "lofi", out)
    with wave.open(str(source)) as a, wave.open(str(out)) as b:
        assert b.getframerate() < a.getframerate()
        assert a.readframes(a.getnframes()) != b.readframes(b.getnframes())


def test_mock_acoustic_attenuates(tmp_path: Path) -> None:
    source, out = tmp_path / "in.wav", tmp_path / "out.wav"
    _write_wav(source)
    MockMusicProvider().render(source, "acoustic", out)
    with wave.open(str(out)) as b:
        assert b.getframerate() == 8000  # no tempo change for acoustic


def test_mock_passes_through_non_wav(tmp_path: Path) -> None:
    source, out = tmp_path / "memo.m4a", tmp_path / "out.m4a"
    source.write_bytes(b"\x00\x00\x00\x20ftypM4A fake-aac-payload")
    MockMusicProvider().render(source, "edm", out)
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
    provider.render(source, "edm", out)
    assert out.read_bytes() == b"generated-music"


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
        provider.render(source, "edm", out)
