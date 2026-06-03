from __future__ import annotations

from fastapi import APIRouter

from app.observability import metrics
from app.providers import registry

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/providers")
def providers() -> dict[str, dict[str, object]]:
    """Reports which provider implementation is active per vertical."""
    return registry.provider_status()


@router.get("/metrics")
def get_metrics() -> dict[str, object]:
    """Request counts by route and status (in-process)."""
    return metrics.snapshot()
