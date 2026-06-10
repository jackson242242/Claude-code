"""Mock music provider: real, audible DSP on WAV input using only the stdlib.

This is deliberately not "fake AI" — it applies a genuine per-style transform
(tempo shift, echo, attenuation) so the end-to-end flow is honest and testable
offline. Non-WAV input (e.g. the watch's AAC/.m4a) passes through unchanged;
production-quality generation comes from the Replicate provider.
"""
from __future__ import annotations

import array
import shutil
import wave
from pathlib import Path

from app.providers.base import MusicProvider

# style id -> (framerate multiplier, echo delay seconds, echo gain, volume)
_PRESETS: dict[str, tuple[float, float, float, float]] = {
    "lofi": (0.85, 0.25, 0.45, 1.0),
    "edm": (1.25, 0.09, 0.35, 1.0),
    "acoustic": (1.0, 0.0, 0.0, 0.7),
    "cinematic": (1.0, 0.45, 0.55, 1.0),
}


def _clamp(value: int) -> int:
    return max(-32768, min(32767, value))


class MockMusicProvider(MusicProvider):
    def render(self, input_path: Path, style: str, output_path: Path) -> None:
        rate_mult, delay_s, echo_gain, volume = _PRESETS.get(
            style, (1.0, 0.0, 0.0, 1.0)
        )
        try:
            with wave.open(str(input_path), "rb") as source:
                params = source.getparams()
                frames = source.readframes(params.nframes)
        except (wave.Error, EOFError):
            # Not 16-bit PCM WAV (e.g. .m4a from the watch): pass through.
            shutil.copyfile(input_path, output_path)
            return
        if params.sampwidth != 2:
            shutil.copyfile(input_path, output_path)
            return

        samples = array.array("h", frames)
        if volume != 1.0:
            samples = array.array("h", (_clamp(int(s * volume)) for s in samples))
        if delay_s > 0 and echo_gain > 0:
            delay = int(delay_s * params.framerate) * params.nchannels
            for i in range(delay, len(samples)):
                samples[i] = _clamp(
                    samples[i] + int(samples[i - delay] * echo_gain)
                )

        with wave.open(str(output_path), "wb") as sink:
            sink.setnchannels(params.nchannels)
            sink.setsampwidth(params.sampwidth)
            sink.setframerate(int(params.framerate * rate_mult))
            sink.writeframes(samples.tobytes())
