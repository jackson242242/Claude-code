"""SkyEmpire M1 API entry point.

Every route is covered by global exception handlers returning the structured
error payload ``{"error": {"message", "type"}}`` — the same envelope as the
repo root backend (CONTRACT.md §1).
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.engine.match import MatchError
from app.engine.state import GameOverError
from app.match_service import MatchNotFoundError
from app.routes import games, ingest, matches, weekly
from app.service import GameNotFoundError, InvalidInputError

app = FastAPI(title="SkyEmpire — Airline Tycoon API (M1)", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    # Dev policy per CONTRACT §1: the Next.js dev server plus open access.
    allow_origins=["http://localhost:3001", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error(message: str, error_type: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"message": message, "type": error_type}},
    )


@app.exception_handler(GameNotFoundError)
async def game_not_found_handler(_request: Request, exc: GameNotFoundError) -> JSONResponse:
    return _error(str(exc), "not_found", 404)


@app.exception_handler(InvalidInputError)
async def invalid_input_handler(_request: Request, exc: InvalidInputError) -> JSONResponse:
    return _error(str(exc), "invalid_request", 400)


@app.exception_handler(GameOverError)
async def game_over_handler(_request: Request, exc: GameOverError) -> JSONResponse:
    return _error(str(exc), "game_over", 400)


@app.exception_handler(MatchNotFoundError)
async def match_not_found_handler(_request: Request, exc: MatchNotFoundError) -> JSONResponse:
    return _error(str(exc), "not_found", 404)


@app.exception_handler(MatchError)
async def match_error_handler(_request: Request, exc: MatchError) -> JSONResponse:
    return _error(str(exc), "match_error", 400)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    _request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    return _error(str(exc.detail), "http_error", exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, _exc: RequestValidationError
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


app.include_router(games.router)
app.include_router(ingest.router)
app.include_router(matches.router)
app.include_router(weekly.router)
