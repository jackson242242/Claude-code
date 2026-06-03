"""Optional PostgreSQL access.

The API runs entirely from the in-process seed data when no DATABASE_URL is
configured, so local development and tests need no database. When a URL is set,
the schedule service prefers the database and falls back to the seed on error.
"""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from app.config import settings

_engine: Engine | None = None


def _normalize(url: str) -> str:
    # Default SQLAlchemy's "postgresql://" to the installed psycopg (v3) driver.
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def get_engine() -> Engine | None:
    global _engine
    if not settings.database_url:
        return None
    if _engine is None:
        _engine = create_engine(
            _normalize(settings.database_url),
            pool_pre_ping=True,
            future=True,
        )
    return _engine
