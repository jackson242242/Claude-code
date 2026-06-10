"""Production provider: melody-conditioned MusicGen via the Replicate API.

The voice memo is sent as the melody conditioning input together with a
per-style text prompt; MusicGen returns generated music that follows the
hummed/sung melody. Enabled by setting ``REPLICATE_API_TOKEN``.

Generation takes 30–120 s, so this provider block-polls; the render's
``status`` field already models the async lifecycle, so moving this to a
background worker later requires no API change.
"""
from __future__ import annotations

import base64
import time
from pathlib import Path

import httpx

from app.providers.base import MusicProvider

_API_URL = "https://api.replicate.com/v1/predictions"
# meta/musicgen "melody" variant (pin a specific version hash in production).
_MODEL_VERSION = "melody"

_PROMPTS: dict[str, str] = {
    "lofi": "lo-fi chillhop beat, warm tape texture, relaxed tempo",
    "edm": "energetic EDM festival drop, four-on-the-floor, bright synths",
    "acoustic": "soft acoustic guitar arrangement, intimate, unplugged",
    "cinematic": "sweeping cinematic orchestral score, epic trailer mood",
}


class ReplicateMusicGenProvider(MusicProvider):
    def __init__(
        self,
        token: str,
        client: httpx.Client | None = None,
        poll_interval: float = 2.0,
        max_wait: float = 180.0,
    ) -> None:
        self._client = client or httpx.Client(
            headers={"Authorization": f"Bearer {token}"}, timeout=30.0
        )
        self._poll_interval = poll_interval
        self._max_wait = max_wait

    def render(self, input_path: Path, style: str, output_path: Path) -> None:
        audio_b64 = base64.b64encode(input_path.read_bytes()).decode()
        created = self._client.post(
            _API_URL,
            json={
                "version": _MODEL_VERSION,
                "input": {
                    "prompt": _PROMPTS.get(style, _PROMPTS["lofi"]),
                    "melody": f"data:audio/wav;base64,{audio_b64}",
                },
            },
        )
        created.raise_for_status()
        prediction = created.json()

        deadline = time.monotonic() + self._max_wait
        while prediction["status"] not in {"succeeded", "failed", "canceled"}:
            if time.monotonic() > deadline:
                raise TimeoutError("MusicGen prediction timed out")
            time.sleep(self._poll_interval)
            polled = self._client.get(prediction["urls"]["get"])
            polled.raise_for_status()
            prediction = polled.json()

        if prediction["status"] != "succeeded":
            raise RuntimeError(f"MusicGen prediction {prediction['status']}")

        audio = self._client.get(prediction["output"])
        audio.raise_for_status()
        output_path.write_bytes(audio.content)
