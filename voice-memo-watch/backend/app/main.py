"""VoiceMemoBot API entry point.

Every route is covered by a global exception handler returning the structured
payload ``{"error": {"message", "type"}}`` — same convention as the main
World Cup backend.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.routers import memos, posts, styles

_WEB_INDEX = Path(__file__).parent / "web" / "index.html"

app = FastAPI(title="VoiceMemoBot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error(message: str, error_type: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"message": message, "type": error_type}},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    _request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    return _error(str(exc.detail), "http_error", exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    return _error("Request validation failed", "validation_error", 422)


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    _request: Request, _exc: Exception
) -> JSONResponse:
    return _error("Internal server error", "internal_error", 500)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse, tags=["meta"])
def web_app() -> HTMLResponse:
    """The web prototype: record → remix (tools 1 click away) → post → feed."""
    return HTMLResponse(_WEB_INDEX.read_text(encoding="utf-8"))


app.include_router(styles.router)
app.include_router(memos.router)
app.include_router(posts.router)
