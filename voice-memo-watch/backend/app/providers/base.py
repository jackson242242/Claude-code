"""Abstract music-transform provider.

Same pattern as the main backend's booking providers: routers depend only on
this interface; real AI services and the mock register behind it in
``registry.py`` — no route changes when swapping implementations.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from app.schemas import RenderRequest


class MusicProvider(ABC):
    @abstractmethod
    def render(
        self, input_path: Path, output_path: Path, spec: RenderRequest
    ) -> None:
        """Transform the memo at ``input_path`` into ``output_path``.

        ``spec`` carries the style, one-click tweaks, instruments to mix in,
        and the user's free-text sound prompt — always applied to the
        original memo, never to a previous render. Raises on failure; the
        caller owns render status bookkeeping.
        """
        raise NotImplementedError
