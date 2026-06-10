"""Catalog of transform styles offered by the recorder bot.

Kept in one place so routers, providers, and tests share a single source of
truth for valid style ids.
"""
from __future__ import annotations

from app.schemas import Style

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
