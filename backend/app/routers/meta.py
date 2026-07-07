from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from fastapi import APIRouter, Header, HTTPException

from app import schemas
from app.config import settings
from app.observability import metrics
from app.providers import mock_hotels, registry
from app.seed import schedule_2026 as _seed
from app.services import deeplinks

router = APIRouter(prefix="/meta", tags=["meta"])


def _check_probe_access(header_token: str | None) -> None:
    """Optionally gate the live-provider probes behind META_PROBE_TOKEN.

    The probes bypass the cache and resilient fallback and hit paid upstream
    APIs directly, so a public deployment may want them locked down. Unset
    (the default) keeps them open for browser debugging per DEPLOY.md.
    """
    expected = settings.meta_probe_token
    if expected and header_token != expected:
        raise HTTPException(status_code=403, detail="Invalid or missing probe token")


def _ss_param(url: str) -> str:
    """Extract Booking.com's ``ss`` (destination) query param from a deep link."""
    return (parse_qs(urlparse(url).query).get("ss") or [""])[0]


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
    x_probe_token: str | None = Header(default=None),
) -> dict[str, object]:
    """Diagnostic: call the live hotel provider directly and report the raw
    result or error. Bypasses the resilient fallback that would otherwise mask a
    misconfigured integration (e.g. a token without Stays access)."""
    _check_probe_access(x_probe_token)
    query = schemas.HotelSearchQuery(
        city_id=city_id, check_in=check_in, check_out=check_out, guests=2
    )
    return registry.probe_hotels(query)


@router.get("/link-audit")
def link_audit(
    check_in: str = "2026-06-15", check_out: str = "2026-06-18"
) -> dict[str, object]:
    """Audit that every host city's hotel deep links are geo-anchored to that
    city — i.e. the Booking.com ``ss`` (destination) contains the city name.

    Catches the class of bug where a generic hotel/brand name resolves globally
    and lands users in the wrong country (e.g. a Mexico City search opening
    hotels in England). Deterministic — exercises the mock offer links and the
    booking-line builder, so it needs no network and is safe to call anytime.
    """
    provider = mock_hotels.MockHotelProvider()
    failures: list[dict[str, object]] = []
    checked = 0
    for city in _seed.CITIES:
        city_id = str(city["id"])
        city_name = str(city["name"])
        query = schemas.HotelSearchQuery(
            city_id=city_id, check_in=check_in, check_out=check_out, guests=2
        )
        for offer in provider.search(query):
            checked += 1
            if city_name.lower() not in _ss_param(offer.deep_link).lower():
                failures.append(
                    {"cityId": city_id, "where": "offer", "deepLink": offer.deep_link}
                )
        item = schemas.TripItem(
            id=f"audit-{city_id}",
            trip_id="audit",
            kind="hotel",
            city_id=city_id,
            title="Sample Hotel",
            created_at="2026-01-01T00:00:00.000Z",
        )
        checked += 1
        line_link = deeplinks.deep_link_for(item)
        if city_name.lower() not in _ss_param(line_link).lower():
            failures.append(
                {"cityId": city_id, "where": "bookingLine", "deepLink": line_link}
            )
    return {
        "ok": not failures,
        "cities": len(_seed.CITIES),
        "checked": checked,
        "failures": failures,
    }


@router.get("/flight-probe")
def flight_probe(
    origin: str = "JFK",
    destination: str = "LAX",
    date: str = "2026-06-15",
    x_probe_token: str | None = Header(default=None),
) -> dict[str, object]:
    """Diagnostic counterpart to /hotel-probe for flights (Duffel Air). Calls
    the live flight provider directly and reports the raw result or error."""
    _check_probe_access(x_probe_token)
    query = schemas.FlightSearchQuery(
        origin=origin, destination=destination, date=date, passengers=1
    )
    return registry.probe_flights(query)
