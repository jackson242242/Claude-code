"""Text-to-speech via edge-tts (free Microsoft Edge neural voices).

Best-effort by design: TTS failure must never sink the brief — the caller gets
False and serves the text-only brief. edge-tts talks to an unofficial endpoint,
so treat it as a prototype-grade dependency (swap for a paid TTS later behind
this same function).
"""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


async def synthesize_to_mp3(text: str, *, voice: str, out_path: Path) -> bool:
    """Render `text` to an mp3 at `out_path`. Returns True on success."""
    if not text.strip():
        return False
    try:
        import edge_tts  # local import: keep the app importable if the dep breaks

        out_path.parent.mkdir(parents=True, exist_ok=True)
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(out_path))
    except Exception:  # noqa: BLE001 — any TTS failure degrades to text-only
        logger.warning("edge-tts synthesis failed", exc_info=True)
        out_path.unlink(missing_ok=True)  # no half-written files
        return False
    return out_path.exists() and out_path.stat().st_size > 0
