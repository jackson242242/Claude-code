from __future__ import annotations

from fastapi import APIRouter

from app import schemas
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


@router.get("/hotel-probe")
def hotel_probe(
    city_id: str = "new-york",
    check_in: str = "2026-06-15",
    check_out: str = "2026-06-18",
) -> dict[str, object]:
    """Diagnostic: call the live hotel provider directly and report the raw
    result or error. Bypasses the resilient fallback that would otherwise mask a
    misconfigured integration (e.g. a token without Stays access)."""
    query = schemas.HotelSearchQuery(
        city_id=city_id, check_in=check_in, check_out=check_out, guests=2
    )
    return registry.probe_hotels(query)
