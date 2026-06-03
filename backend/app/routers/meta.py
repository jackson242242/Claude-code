from __future__ import annotations

from fastapi import APIRouter

from app.providers import registry

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/providers")
def providers() -> dict[str, dict[str, object]]:
    """Reports which provider implementation is active per vertical."""
    return registry.provider_status()
