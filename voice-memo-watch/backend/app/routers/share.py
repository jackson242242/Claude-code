"""Public share page for a render.

Social platforms do not accept direct audio uploads from watchOS, so the watch
shares this link instead (via ShareLink / iPhone Handoff). The page embeds an
audio player and Open Graph tags so the link unfurls nicely when posted.
"""
from __future__ import annotations

import html

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from app.routers.memos import _public_base_url
from app.store import get_store

router = APIRouter(tags=["share"])

_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta property="og:title" content="{title}">
<meta property="og:description" content="Made with VoiceMemoBot on Apple Watch">
<meta property="og:type" content="music.song">
<meta property="og:audio" content="{file_url}">
<meta property="og:url" content="{share_url}">
</head>
<body style="font-family: system-ui; max-width: 32rem; margin: 4rem auto; text-align: center;">
<h1>{title}</h1>
<p>A voice memo, remixed by AI.</p>
<audio controls src="{file_url}" style="width: 100%"></audio>
</body>
</html>"""


@router.get("/share/{render_id}", response_class=HTMLResponse)
def share_page(render_id: str) -> HTMLResponse:
    record = get_store().get_render(render_id)
    if record is None or record.status != "ready":
        raise HTTPException(404, "Render not found")
    base = _public_base_url()
    return HTMLResponse(
        _PAGE.format(
            title=html.escape(f"{record.style.title()} remix · VoiceMemoBot"),
            file_url=f"{base}/renders/{record.id}/file",
            share_url=f"{base}/share/{record.id}",
        )
    )
