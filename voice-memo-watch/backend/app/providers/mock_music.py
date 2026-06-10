"""Mock music provider: real, audible DSP on WAV input using only the stdlib.

This is deliberately not "fake AI" — every control produces a genuine
transform so the end-to-end flow is honest and testable offline:

- styles: tempo shift, echo, attenuation presets;
- tweaks: speed, extra echo, volume, reverse;
- instruments: synthesized layers (sine/saw/square/triangle/noise) that track
  the memo's amplitude envelope and rough pitch (zero-crossing estimate), so
  humming a melody really does play it on the chosen instruments;
- prompt: keyword heuristics (e.g. "whisper" → quiet, "demon" → deep,
  "robot" → ring modulation). True character-voice conversion is an AI-model
  capability — see the Replicate provider / README.

Non-WAV input (e.g. the watch's AAC/.m4a) passes through unchanged.
"""
from __future__ import annotations

import array
import math
import shutil
import wave
from pathlib import Path

from app.providers.base import MusicProvider
from app.schemas import RenderRequest

# style id -> (framerate multiplier, echo delay seconds, echo gain, volume)
_PRESETS: dict[str, tuple[float, float, float, float]] = {
    "lofi": (0.85, 0.25, 0.45, 1.0),
    "edm": (1.25, 0.09, 0.35, 1.0),
    "acoustic": (1.0, 0.0, 0.0, 0.7),
    "cinematic": (1.0, 0.45, 0.55, 1.0),
}

_TWEAK_ECHO_DELAY_S = 0.25

# instrument id -> waveform shape used for the synthesized layer
_INSTRUMENT_WAVES: dict[str, str] = {
    "piano": "triangle",
    "strings": "saw",
    "synth": "square",
    "flute": "sine",
    "drums": "noise",
}

# prompt keyword -> (speed multiplier, volume multiplier, echo gain, ring Hz)
_PROMPT_EFFECTS: dict[str, tuple[float, float, float, float]] = {
    "whisper": (1.0, 0.4, 0.0, 0.0),
    "soft": (1.0, 0.6, 0.0, 0.0),
    "sigh": (0.9, 0.5, 0.0, 0.0),
    "deep": (0.75, 1.0, 0.0, 0.0),
    "demon": (0.75, 1.0, 0.3, 0.0),
    "monster": (0.7, 1.0, 0.3, 0.0),
    "villain": (0.8, 1.0, 0.3, 0.0),
    "high": (1.35, 1.0, 0.0, 0.0),
    "chipmunk": (1.5, 1.0, 0.0, 0.0),
    "squeaky": (1.4, 1.0, 0.0, 0.0),
    "robot": (1.0, 1.0, 0.0, 30.0),
    "alien": (1.0, 1.0, 0.2, 45.0),
    "cave": (1.0, 1.0, 0.5, 0.0),
    "echo": (1.0, 1.0, 0.5, 0.0),
    "hall": (1.0, 1.0, 0.45, 0.0),
    "shout": (1.05, 1.6, 0.0, 0.0),
    "loud": (1.0, 1.5, 0.0, 0.0),
}

_ANALYSIS_WINDOW = 512  # frames per envelope/pitch window


def _clamp(value: int) -> int:
    return max(-32768, min(32767, value))


def _effects_from_prompt(prompt: str) -> tuple[float, float, float, float]:
    """Fold every recognized keyword into (speed, volume, echo, ring Hz)."""
    speed, volume, echo, ring_hz = 1.0, 1.0, 0.0, 0.0
    for word in prompt.lower().split():
        effect = _PROMPT_EFFECTS.get(word.strip(".,!?\"'"))
        if effect is None:
            continue
        speed *= effect[0]
        volume *= effect[1]
        echo = max(echo, effect[2])
        ring_hz = max(ring_hz, effect[3])
    return max(0.5, min(2.0, speed)), max(0.1, min(2.0, volume)), echo, ring_hz


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


def _track_envelope_and_pitch(
    samples: array.array, framerate: int, nchannels: int
) -> tuple[list[float], list[float]]:
    """Per-window amplitude (0..1) and rough pitch (Hz, zero-crossing based)
    of channel 0 — enough for instruments to follow hummed melodies."""
    mono = samples[::nchannels]
    envelope: list[float] = []
    pitches: list[float] = []
    for start in range(0, len(mono), _ANALYSIS_WINDOW):
        window = mono[start : start + _ANALYSIS_WINDOW]
        if not window:
            break
        rms = math.sqrt(sum(s * s for s in window) / len(window)) / 32768.0
        crossings = sum(
            1 for a, b in zip(window, window[1:]) if (a < 0) != (b < 0)
        )
        freq = crossings / 2 * framerate / len(window)
        envelope.append(min(1.0, rms * 4))
        pitches.append(min(1000.0, max(80.0, freq)) if rms > 0.01 else 0.0)
    return envelope, pitches


def _instrument_layer(
    wave_name: str,
    envelope: list[float],
    pitches: list[float],
    nframes: int,
    framerate: int,
) -> list[float]:
    """Synthesize one instrument layer (-1..1 floats) following the memo."""
    layer = [0.0] * nframes
    phase = 0.0
    for i in range(nframes):
        window = min(i // _ANALYSIS_WINDOW, len(envelope) - 1)
        amplitude = envelope[window]
        freq = pitches[window]
        if amplitude <= 0.0 or freq <= 0.0:
            continue
        if wave_name == "noise":
            # deterministic pseudo-noise, gated by the envelope (drum feel)
            layer[i] = amplitude * (math.sin(i * 12.9898) * 43758.5453 % 2 - 1)
            continue
        phase += 2 * math.pi * freq / framerate
        cycle = (phase / (2 * math.pi)) % 1.0
        if wave_name == "sine":
            value = math.sin(phase)
        elif wave_name == "saw":
            value = 2 * cycle - 1
        elif wave_name == "square":
            value = 1.0 if cycle < 0.5 else -1.0
        else:  # triangle
            value = 2 * abs(2 * cycle - 1) - 1
        layer[i] = amplitude * value
    return layer


def _mix_instruments(
    samples: array.array,
    instruments: list[str],
    framerate: int,
    nchannels: int,
) -> array.array:
    envelope, pitches = _track_envelope_and_pitch(samples, framerate, nchannels)
    if not envelope:
        return samples
    nframes = len(samples) // nchannels
    layers = [
        _instrument_layer(
            _INSTRUMENT_WAVES[instrument], envelope, pitches, nframes, framerate
        )
        for instrument in instruments
        if instrument in _INSTRUMENT_WAVES
    ]
    if not layers:
        return samples
    instrument_gain = 9000 / len(layers)  # keep headroom as layers stack
    mixed = array.array("h", samples)
    for i in range(len(mixed)):
        frame = i // nchannels
        added = sum(layer[frame] for layer in layers) * instrument_gain
        mixed[i] = _clamp(int(mixed[i] * 0.7 + added))
    return mixed


class MockMusicProvider(MusicProvider):
    def render(
        self, input_path: Path, output_path: Path, spec: RenderRequest
    ) -> None:
        rate_mult, delay_s, echo_gain, volume = _PRESETS.get(
            spec.style, (1.0, 0.0, 0.0, 1.0)
        )
        prompt_speed, prompt_volume, prompt_echo, ring_hz = _effects_from_prompt(
            spec.prompt
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
        volume_total = volume * spec.tweaks.volume * prompt_volume
        if volume_total != 1.0:
            samples = array.array(
                "h", (_clamp(int(s * volume_total)) for s in samples)
            )
        if ring_hz > 0:
            samples = array.array(
                "h",
                (
                    _clamp(
                        int(
                            s
                            * (
                                0.5
                                + 0.5
                                * math.sin(
                                    2
                                    * math.pi
                                    * ring_hz
                                    * (i // params.nchannels)
                                    / params.framerate
                                )
                            )
                        )
                    )
                    for i, s in enumerate(samples)
                ),
            )
        if delay_s > 0 and echo_gain > 0:
            _apply_echo(
                samples,
                int(delay_s * params.framerate),
                echo_gain,
                params.nchannels,
            )
        extra_echo = max(spec.tweaks.echo, prompt_echo)
        if extra_echo > 0:
            _apply_echo(
                samples,
                int(_TWEAK_ECHO_DELAY_S * params.framerate),
                extra_echo,
                params.nchannels,
            )
        if spec.instruments:
            samples = _mix_instruments(
                samples, spec.instruments, params.framerate, params.nchannels
            )
        if spec.tweaks.reverse:
            samples = _reverse_frames(samples, params.nchannels)

        with wave.open(str(output_path), "wb") as sink:
            sink.setnchannels(params.nchannels)
            sink.setsampwidth(params.sampwidth)
            sink.setframerate(
                int(params.framerate * rate_mult * spec.tweaks.speed * prompt_speed)
            )
            sink.writeframes(samples.tobytes())
