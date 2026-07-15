"""Application error type and global exception handlers.

All errors flow through a single shape: {"error": {"message", "type"}}.
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Domain error carrying an HTTP status and a stable error type string."""

    def __init__(self, message: str, type: str = "api_error", status: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.type = type
        self.status = status


def _body(message: str, type: str) -> dict[str, dict[str, str]]:
    return {"error": {"message": message, "type": type}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status, content=_body(exc.message, exc.type))

    @app.exception_handler(RequestValidationError)
    async def _handle_validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=_body(str(exc.errors()), "validation_error"),
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content=_body("Internal server error", "internal_error"),
        )
