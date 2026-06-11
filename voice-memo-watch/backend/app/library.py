"""The built-in backing-track library, synthesized offline with the stdlib.

Each track is a deterministic loop generator: ``track_samples`` renders the
loop at any frame rate / length so the mock provider can lay it under a memo
of any format, and ``write_preview`` renders a standalone WAV for the
library browser. No audio assets are shipped — everything is synthesized,
which keeps the repo small and the licence story trivial (all sounds are
ours).
"""
from __future__ import annotations

import math
import wave
from pathlib import Path

_PREVIEW_SECONDS = 8.0
_PREVIEW_RATE = 22050


def _noise(i: int) -> float:
    """Deterministic pseudo-noise in -1..1."""
    return (math.sin(i * 12.9898) * 43758.5453) % 2 - 1


def _tri(cycles: float) -> float:
    return 2 * abs(2 * (cycles % 1.0) - 1) - 1


def _saw(cycles: float) -> float:
    return 2 * (cycles % 1.0) - 1


def _kick(t_in_beat: float) -> float:
    """A pitched-down sine thump."""
    freq = 50 + 90 * math.exp(-t_in_beat * 28)
    return math.sin(2 * math.pi * freq * t_in_beat) * math.exp(-t_in_beat * 16)


def _lofi_beat(t: float, i: int) -> float:
    beat = 60 / 75  # 75 BPM
    tb = t % beat
    kick = _kick(tb) * (0.9 if int(t / beat) % 2 == 0 else 0.45)
    hat = _noise(i) * math.exp(-(t % (beat / 2)) * 55) * 0.12
    bass_freq = 55.0 if int(t / (beat * 4)) % 2 == 0 else 41.2  # A1 / E1
    bass = _tri(bass_freq * t) * 0.22
    return kick * 0.8 + hat + bass


def _edm_pulse(t: float, i: int) -> float:
    beat = 60 / 128  # 128 BPM
    tb = t % beat
    kick = _kick(tb)
    eighth = t % (beat / 2)
    pump = math.exp(-eighth * 9)
    bass_freq = 55.0 if int(t / (beat * 8)) % 2 == 0 else 73.4  # A1 / D2
    bass = _saw(bass_freq * t) * 0.3 * pump
    hat = _noise(i) * math.exp(-((t + beat / 2) % beat) * 70) * 0.1
    return kick * 0.85 + bass + hat


_FOLK_CHORDS = [  # C, G, Am, F triads
    (130.8, 164.8, 196.0),
    (98.0, 123.5, 146.8),
    (110.0, 130.8, 164.8),
    (87.3, 110.0, 130.8),
]


def _acoustic_strum(t: float, _i: int) -> float:
    chord = _FOLK_CHORDS[int(t / 1.0) % len(_FOLK_CHORDS)]
    strum_env = math.exp(-(t % 0.5) * 4)
    return sum(_saw(freq * t) for freq in chord) * 0.09 * strum_env


_PAD_CHORDS = [  # Am, F — slow swells
    (110.0, 164.8, 220.0),
    (87.3, 130.8, 174.6),
]


def _cinematic_pad(t: float, _i: int) -> float:
    chord = _PAD_CHORDS[int(t / 4.0) % len(_PAD_CHORDS)]
    swell = 0.5 + 0.5 * math.sin(2 * math.pi * 0.12 * t - math.pi / 2)
    return sum(math.sin(2 * math.pi * freq * t) for freq in chord) * 0.11 * swell


def _rain_texture(t: float, i: int) -> float:
    drizzle = _noise(i) * 0.16 * (0.7 + 0.3 * math.sin(2 * math.pi * 0.05 * t))
    drop = _noise(i * 7) * math.exp(-(t % 1.7) * 30) * 0.2
    return drizzle + drop


_GENERATORS = {
    "lofi_beat": _lofi_beat,
    "edm_pulse": _edm_pulse,
    "acoustic_strum": _acoustic_strum,
    "cinematic_pad": _cinematic_pad,
    "rain_texture": _rain_texture,
}


def track_samples(track_id: str, framerate: int, nframes: int) -> list[float]:
    """Render *nframes* of the track loop (-1..1 floats) at *framerate*."""
    generator = _GENERATORS[track_id]
    return [generator(i / framerate, i) for i in range(nframes)]


def write_preview(track_id: str, output_path: Path) -> None:
    """Render the standalone preview loop the library browser plays."""
    nframes = int(_PREVIEW_SECONDS * _PREVIEW_RATE)
    samples = track_samples(track_id, _PREVIEW_RATE, nframes)
    with wave.open(str(output_path), "wb") as sink:
        sink.setnchannels(1)
        sink.setsampwidth(2)
        sink.setframerate(_PREVIEW_RATE)
        sink.writeframes(
            b"".join(
                int(max(-1.0, min(1.0, value)) * 32767).to_bytes(
                    2, "little", signed=True
                )
                for value in samples
            )
        )
