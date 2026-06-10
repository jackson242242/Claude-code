"""Catalog of transform styles and instruments offered by the recorder bot.

Kept in one place so routers, providers, and tests share a single source of
truth for valid ids.
"""
from __future__ import annotations

from app.schemas import Instrument, Style

STYLES: list[Style] = [
    Style(
        id="lofi",
        label="Lo-fi chill",
        description="Slowed down with a soft tape echo — bedroom beats.",
    ),
    Style(
        id="edm",
        label="EDM lift",
        description="Sped up with a tight slapback — festival energy.",
    ),
    Style(
        id="acoustic",
        label="Acoustic soft",
        description="Gentle, attenuated mix — unplugged feel.",
    ),
    Style(
        id="cinematic",
        label="Cinematic hall",
        description="Long decaying echo — trailer-sized space.",
    ),
]

STYLE_IDS = {style.id for style in STYLES}

INSTRUMENTS: list[Instrument] = [
    Instrument(
        id="piano",
        label="Piano",
        description="Warm keys that follow your melody.",
    ),
    Instrument(
        id="strings",
        label="Strings",
        description="A string ensemble tracking your pitch.",
    ),
    Instrument(
        id="synth",
        label="Synth",
        description="A bold square-wave lead.",
    ),
    Instrument(
        id="flute",
        label="Flute",
        description="A pure, airy tone over your voice.",
    ),
    Instrument(
        id="drums",
        label="Drums",
        description="Percussive hits following your rhythm.",
    ),
]

INSTRUMENT_IDS = {instrument.id for instrument in INSTRUMENTS}
