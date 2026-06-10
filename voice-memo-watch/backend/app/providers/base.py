"""Abstract music-transform provider.

Same pattern as the main backend's booking providers: routers depend only on
this interface; real AI services and the mock register behind it in
``registry.py`` — no route changes when swapping implementations.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class MusicProvider(ABC):
    @abstractmethod
    def render(self, input_path: Path, style: str, output_path: Path) -> None:
        """Transform the memo at ``input_path`` into ``output_path``.

        Raises on failure; the caller owns render status bookkeeping.
        """
        raise NotImplementedError
