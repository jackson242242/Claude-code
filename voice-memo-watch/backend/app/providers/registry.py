"""Env-driven provider selection with mock fallback, mirroring the main
backend's registry: real service when configured, mock otherwise."""
from __future__ import annotations

import os

from app.providers.base import MusicProvider
from app.providers.mock_music import MockMusicProvider
from app.providers.replicate_musicgen import ReplicateMusicGenProvider


def music_provider() -> MusicProvider:
    token = os.environ.get("REPLICATE_API_TOKEN")
    if token:
        return ReplicateMusicGenProvider(token)
    return MockMusicProvider()
