from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse

from app.catalog import STYLE_IDS
from app.providers.registry import music_provider
from app.schemas import Memo, Render, RenderRequest
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
    return os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")


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
        style=record.style,
        tweaks=record.tweaks,
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
    store = get_store()
    memo = store.get_memo(memo_id)
    if memo is None:
        raise HTTPException(404, "Memo not found")
    record = store.create_render(memo, request.style, request.tweaks)
    try:
        music_provider().render(memo.path, request.style, record.path, request.tweaks)
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
        filename=f"{record.style}-{record.id}{record.path.suffix}",
    )
