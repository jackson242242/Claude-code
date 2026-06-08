"""Geo-anchoring audit for booking deep links.

Guards the class of bug where a hotel "Book now" link used a bare hotel/brand
name as Booking.com's search string, so results resolved globally (wrong
country) instead of the searched host city.
"""
from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient

from app import schemas
from app.providers.mock_hotels import MockHotelProvider
from app.providers.util import booking_hotel_link, city_label


def _ss(url: str) -> str:
    return (parse_qs(urlparse(url).query).get("ss") or [""])[0]


def test_city_label_includes_country() -> None:
    assert city_label("mexico-city") == "Mexico City, Mexico"
    assert city_label("unknown-id") == "unknown-id"  # graceful fallback


def test_booking_link_destination_is_the_city() -> None:
    url = booking_hotel_link("Mexico City, Mexico", "2026-06-15", "2026-06-18", 2)
    assert "booking.com/searchresults" in url
    assert _ss(url) == "Mexico City, Mexico"


def test_mock_hotel_offers_anchor_to_searched_city() -> None:
    offers = MockHotelProvider().search(
        schemas.HotelSearchQuery(
            city_id="mexico-city",
            check_in="2026-06-15",
            check_out="2026-06-18",
            guests=2,
        )
    )
    assert offers
    for offer in offers:
        assert offer.deep_link is not None
        assert "Mexico City" in _ss(offer.deep_link)


def test_link_audit_route_passes_for_every_city(client: TestClient) -> None:
    response = client.get("/meta/link-audit")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True, body["failures"]
    assert body["failures"] == []
    assert body["cities"] >= 16
    assert body["checked"] > 0


def test_audit_detects_a_non_anchored_link() -> None:
    # Sanity: the audit's membership check must actually flag a bad link.
    bad = booking_hotel_link("Grand Plaza", "2026-06-15", "2026-06-18", 2)
    assert "Mexico City".lower() not in _ss(bad).lower()
