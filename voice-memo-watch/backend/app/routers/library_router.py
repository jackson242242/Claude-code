"""The built-in music library: browse backing tracks and play previews."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app import library
from app.catalog import LIBRARY_TRACK_IDS, LIBRARY_TRACKS
from app.routers.memos import _public_base_url
from app.schemas import LibraryTrack
from app.store import get_store

router = APIRouter(tags=["library"])


@router.get("/library", response_model=list[LibraryTrack])
def list_library() -> list[LibraryTrack]:
    base = _public_base_url()
    return [
        track.model_copy(update={"file_url": f"{base}/library/{track.id}/file"})
        for track in LIBRARY_TRACKS
    ]


@router.get("/library/{track_id}/file")
def library_preview(track_id: str) -> FileResponse:
    if track_id not in LIBRARY_TRACK_IDS:
        raise HTTPException(404, "Library track not found")
    # synthesized on first request, then served from the storage dir
    path = get_store().storage_dir / f"library-{track_id}.wav"
    if not path.exists():
        library.write_preview(track_id, path)
    return FileResponse(path, media_type="audio/wav", filename=f"{track_id}.wav")
