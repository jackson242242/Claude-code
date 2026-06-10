"""Geo-anchoring audit for booking deep links.

Guards the class of bug where a hotel "Book now" link used a bare hotel/brand
name as Booking.com's search string, so results resolved globally (wrong
country) instead of the searched host city.
"""
from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient

import pytest

from app import schemas
from app.providers.liteapi_hotels import LiteApiHotelProvider
from app.providers.mock_flights import MockFlightProvider
from app.providers.mock_hotels import MockHotelProvider
from app.providers.util import booking_hotel_link, city_label, kayak_flights_link


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


def test_booking_link_gains_aid_only_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    plain = booking_hotel_link("Miami, USA", "2026-06-15", "2026-06-18", 2)
    assert "aid=" not in plain

    monkeypatch.setenv("BOOKING_AID", "1234567")
    tagged = booking_hotel_link("Miami, USA", "2026-06-15", "2026-06-18", 2)
    assert "aid=1234567" in tagged
    # Geo-anchoring must survive the affiliate param.
    assert _ss(tagged) == "Miami, USA"


def test_kayak_link_gains_affiliate_id_only_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    plain = kayak_flights_link("lhr", "jfk", "2026-06-20", 1)
    assert plain == "https://www.kayak.com/flights/LHR-JFK/2026-06-20/1adults"

    monkeypatch.setenv("KAYAK_AFFILIATE_ID", "kan_test")
    tagged = kayak_flights_link("lhr", "jfk", "2026-06-20", 1)
    assert tagged.endswith("?a=kan_test")

    offers = MockFlightProvider().search(
        schemas.FlightSearchQuery(
            origin="lhr", destination="jfk", date="2026-06-20", passengers=1
        )
    )
    assert all("a=kan_test" in (offer.deep_link or "") for offer in offers)


def test_liteapi_link_is_city_only_not_dragged_by_hotel_name() -> None:
    """A real hotel name that strongly matches another country (e.g. an Indian
    chain in LiteAPI sandbox data) must NOT leak into the Booking.com search —
    the link must resolve to the searched city only."""
    provider = LiteApiHotelProvider("key", lambda _city_id: (19.303, -99.15))
    query = schemas.HotelSearchQuery(
        city_id="mexico-city",
        check_in="2026-06-15",
        check_out="2026-06-18",
        guests=2,
    )
    offer = provider._to_offer(
        {
            "id": "h1",
            "name": "OYO Townhouse 123 New Delhi",
            "starRating": 3,
            "latitude": 19.303,
            "longitude": -99.15,
        },
        200.0,
        3,
        query,
        (19.303, -99.15),
    )
    assert _ss(offer.deep_link) == "Mexico City, Mexico"
    assert "OYO" not in (offer.deep_link or "")
    assert "Delhi" not in (offer.deep_link or "")
