from __future__ import annotations

import io
import wave
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import store
from app.main import app


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("VOICEMEMO_STORAGE_DIR", str(tmp_path / "storage"))
    monkeypatch.delenv("REPLICATE_API_TOKEN", raising=False)
    monkeypatch.delenv("PUBLIC_BASE_URL", raising=False)
    monkeypatch.delenv("RENDER_EXTERNAL_URL", raising=False)
    store.reset_store_for_tests()
    return TestClient(app)


def make_wav(seconds: float = 1.0, framerate: int = 8000) -> bytes:
    """A small mono 16-bit PCM WAV with a simple ramp waveform."""
    buffer = io.BytesIO()
    nframes = int(seconds * framerate)
    samples = bytearray()
    for i in range(nframes):
        value = (i % 200) * 100 - 10000
        samples += value.to_bytes(2, "little", signed=True)
    with wave.open(buffer, "wb") as sink:
        sink.setnchannels(1)
        sink.setsampwidth(2)
        sink.setframerate(framerate)
        sink.writeframes(bytes(samples))
    return buffer.getvalue()
