"""FastAPI application entry point.

Every route is covered by a global exception handler that returns a structured
JSON error payload of the form ``{"error": {"message", "type"}}`` — this is the
project-wide "wrap all API routes in a global try/catch" rule, implemented once.
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

from app.config import settings
from app.observability import metrics
from app.routers import (
    bookings,
    flights,
    hotels,
    meta,
    schedule,
    transport,
    trips,
)

_CACHEABLE_GETS = {"/matches", "/cities", "/teams"}

app = FastAPI(title="World Cup 2026 Tour Guide API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
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


@app.middleware("http")
async def observe_and_cache(request: Request, call_next) -> Response:
    response = await call_next(request)
    route = request.scope.get("route")
    path = getattr(route, "path", request.url.path)
    metrics.record(request.method, path, response.status_code)
    if request.method == "GET" and path in _CACHEABLE_GETS:
        response.headers.setdefault("Cache-Control", "public, max-age=60")
    return response


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(schedule.router)
app.include_router(flights.router)
app.include_router(hotels.router)
app.include_router(transport.router)
app.include_router(trips.router)
app.include_router(bookings.router)
app.include_router(meta.router)
