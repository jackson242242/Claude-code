from __future__ import annotations

import array
import os
import wave
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse

from app.catalog import INSTRUMENT_IDS, STYLE_IDS
from app.providers.registry import music_provider
from app.schemas import Memo, Render, RenderRequest, Transcription
from app.store import MemoRecord, RenderRecord, get_store

router = APIRouter(tags=["memos"])

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
_ALLOWED_CONTENT_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/aac",
    "audio/mpeg",
}


def _public_base_url() -> str:
    """PUBLIC_BASE_URL wins; on Render, RENDER_EXTERNAL_URL is set
    automatically so deployed file URLs and permalinks are correct with no
    manual wiring."""
    base = (
        os.environ.get("PUBLIC_BASE_URL")
        or os.environ.get("RENDER_EXTERNAL_URL")
        or "http://localhost:8000"
    )
    return base.rstrip("/")


def _memo_out(record: MemoRecord) -> Memo:
    return Memo(
        id=record.id,
        filename=record.filename,
        content_type=record.content_type,
        size_bytes=record.size_bytes,
        created_at=record.created_at,
    )


def _render_out(record: RenderRecord) -> Render:
    return Render(
        id=record.id,
        memo_id=record.memo_id,
        style=record.spec.style,
        tweaks=record.spec.tweaks,
        instruments=record.spec.instruments,
        prompt=record.spec.prompt,
        status=record.status,
        file_url=f"{_public_base_url()}/renders/{record.id}/file",
        created_at=record.created_at,
    )


@router.post("/memos", response_model=Memo, status_code=201)
async def upload_memo(file: UploadFile) -> Memo:
    content_type = (file.content_type or "").split(";")[0].strip()
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(415, f"Unsupported audio type: {content_type or 'unknown'}")
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Voice memo exceeds the 15 MB limit")
    if not data:
        raise HTTPException(422, "Empty upload")
    record = get_store().save_memo(file.filename or "memo", content_type, data)
    return _memo_out(record)


@router.delete("/memos/{memo_id}", status_code=204)
def delete_memo(memo_id: str) -> Response:
    if not get_store().delete_memo(memo_id):
        raise HTTPException(404, "Memo not found")
    return Response(status_code=204)


@router.post("/memos/{memo_id}/renders", response_model=Render, status_code=201)
def create_render(memo_id: str, request: RenderRequest) -> Render:
    if request.style not in STYLE_IDS:
        raise HTTPException(422, f"Unknown style: {request.style}")
    unknown = [i for i in request.instruments if i not in INSTRUMENT_IDS]
    if unknown:
        raise HTTPException(422, f"Unknown instruments: {', '.join(unknown)}")
    store = get_store()
    memo = store.get_memo(memo_id)
    if memo is None:
        raise HTTPException(404, "Memo not found")
    record = store.create_render(memo, request)
    try:
        music_provider().render(memo.path, record.path, request)
    except Exception:
        store.mark_render(record.id, "failed")
        raise HTTPException(502, "Music rendering failed")
    store.mark_render(record.id, "ready")
    return _render_out(store.get_render(record.id) or record)


@router.get("/renders/{render_id}", response_model=Render)
def get_render(render_id: str) -> Render:
    record = get_store().get_render(render_id)
    if record is None:
        raise HTTPException(404, "Render not found")
    return _render_out(record)


@router.post("/memos/{memo_id}/transcribe", response_model=Transcription)
def transcribe_memo(memo_id: str) -> Transcription:
    """Return a text transcription of the voice memo.

    In mock mode (no WHISPER_API_KEY) this analyses the WAV energy envelope
    and returns a placeholder. Set WHISPER_API_KEY for real OpenAI Whisper
    transcription.
    """
    store = get_store()
    memo = store.get_memo(memo_id)
    if memo is None:
        raise HTTPException(404, "Memo not found")
    whisper_key = os.environ.get("WHISPER_API_KEY")
    if whisper_key:
        text = _whisper_transcribe(memo.path, whisper_key)
    else:
        text = _mock_transcribe(memo.path)
    return Transcription(memo_id=memo_id, text=text)


def _mock_transcribe(path: Path) -> str:
    """Heuristic mock: read WAV energy to produce a descriptive placeholder."""
    try:
        with wave.open(str(path), "rb") as wf:
            nframes = wf.getnframes()
            framerate = wf.getframerate()
            sampwidth = wf.getsampwidth()
            raw = wf.readframes(nframes)
        if sampwidth != 2:
            return "[Voice memo recorded — connect Whisper API for real transcription]"
        samples = array.array("h", raw)
        if not samples:
            return "[Silence]"
        energy = sum(abs(s) for s in samples) / len(samples)
        duration_s = nframes / max(1, framerate)
        level = "loud" if energy > 4000 else "quiet" if energy < 500 else "moderate"
        return (
            f"[Mock transcript — {duration_s:.1f}s of {level} audio. "
            "Set WHISPER_API_KEY for real transcription.]"
        )
    except Exception:
        return "[Voice memo recorded — connect Whisper API for real transcription]"


def _whisper_transcribe(path: Path, api_key: str) -> str:
    """Call OpenAI Whisper v1 transcription endpoint."""
    import json as _json
    import urllib.request

    with open(path, "rb") as f:
        audio_data = f.read()
    boundary = "----VoiceMemoBotBoundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="memo{path.suffix}"\r\n'
        "Content-Type: audio/wav\r\n\r\n"
    ).encode() + audio_data + (
        f"\r\n--{boundary}\r\n"
        'Content-Disposition: form-data; name="model"\r\n\r\n'
        f"whisper-1\r\n--{boundary}--\r\n"
    ).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return _json.loads(resp.read())["text"]


@router.get("/renders/{render_id}/file")
def download_render(render_id: str) -> FileResponse:
    record = get_store().get_render(render_id)
    if record is None or record.status != "ready":
        raise HTTPException(404, "Render not found")
    memo = get_store().get_memo(record.memo_id)
    media_type = memo.content_type if memo else "application/octet-stream"
    return FileResponse(
        record.path,
        media_type=media_type,
        filename=f"{record.spec.style}-{record.id}{record.path.suffix}",
    )
