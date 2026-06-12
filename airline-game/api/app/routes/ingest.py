"""M4.2 Ingest endpoint: POST /api/ingest/news.

Auth: X-Ingest-Token header must match INGEST_TOKEN env var.
  - INGEST_TOKEN unset → 503 {"detail": "ingest not configured"}
  - Token mismatch   → 403 {"detail": "forbidden"}
  - Token match      → 200 {"fetched": int, "accepted": int, "rejected": int}
"""
from __future__ import annotations

import os

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

from app.services.news_events import ingest_news

router = APIRouter(prefix="/api", tags=["ingest"])


@router.post("/ingest/news")
def post_ingest_news(
    x_ingest_token: str | None = Header(default=None),
) -> JSONResponse:
    """Trigger a news ingest cycle.

    Protected by X-Ingest-Token header.  INGEST_TOKEN env var must be set.
    """
    ingest_token = os.environ.get("INGEST_TOKEN", "").strip()

    if not ingest_token:
        return JSONResponse(
            status_code=503,
            content={"detail": "ingest not configured"},
        )

    if x_ingest_token != ingest_token:
        return JSONResponse(
            status_code=403,
            content={"detail": "forbidden"},
        )

    result = ingest_news()
    return JSONResponse(status_code=200, content=result)
