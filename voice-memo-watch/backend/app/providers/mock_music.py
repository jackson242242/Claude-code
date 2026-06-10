"""Mock music provider: real, audible DSP on WAV input using only the stdlib.

This is deliberately not "fake AI" — it applies a genuine per-style transform
(tempo shift, echo, attenuation) plus the user's one-click tweaks (speed,
extra echo, volume, reverse) so the end-to-end flow is honest and testable
offline. Non-WAV input (e.g. the watch's AAC/.m4a) passes through unchanged;
production-quality generation comes from the Replicate provider.
"""
from __future__ import annotations

import array
import shutil
import wave
from pathlib import Path

from app.providers.base import MusicProvider
from app.schemas import Tweaks

# style id -> (framerate multiplier, echo delay seconds, echo gain, volume)
_PRESETS: dict[str, tuple[float, float, float, float]] = {
    "lofi": (0.85, 0.25, 0.45, 1.0),
    "edm": (1.25, 0.09, 0.35, 1.0),
    "acoustic": (1.0, 0.0, 0.0, 0.7),
    "cinematic": (1.0, 0.45, 0.55, 1.0),
}

_TWEAK_ECHO_DELAY_S = 0.25


def _clamp(value: int) -> int:
    return max(-32768, min(32767, value))


def _apply_echo(
    samples: array.array, delay_frames: int, gain: float, nchannels: int
) -> None:
    delay = delay_frames * nchannels
    for i in range(delay, len(samples)):
        samples[i] = _clamp(samples[i] + int(samples[i - delay] * gain))


def _reverse_frames(samples: array.array, nchannels: int) -> array.array:
    reversed_samples = array.array("h")
    for frame_start in range(len(samples) - nchannels, -1, -nchannels):
        reversed_samples.extend(samples[frame_start : frame_start + nchannels])
    return reversed_samples


class MockMusicProvider(MusicProvider):
    def render(
        self,
        input_path: Path,
        style: str,
        output_path: Path,
        tweaks: Tweaks | None = None,
    ) -> None:
        tweaks = tweaks or Tweaks()
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
        volume_total = volume * tweaks.volume
        if volume_total != 1.0:
            samples = array.array(
                "h", (_clamp(int(s * volume_total)) for s in samples)
            )
        if delay_s > 0 and echo_gain > 0:
            _apply_echo(
                samples,
                int(delay_s * params.framerate),
                echo_gain,
                params.nchannels,
            )
        if tweaks.echo > 0:
            _apply_echo(
                samples,
                int(_TWEAK_ECHO_DELAY_S * params.framerate),
                tweaks.echo,
                params.nchannels,
            )
        if tweaks.reverse:
            samples = _reverse_frames(samples, params.nchannels)

        with wave.open(str(output_path), "wb") as sink:
            sink.setnchannels(params.nchannels)
            sink.setsampwidth(params.sampwidth)
            sink.setframerate(int(params.framerate * rate_mult * tweaks.speed))
            sink.writeframes(samples.tobytes())
