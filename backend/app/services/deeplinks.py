"""Builds partner search deep links for booking lines (affiliate model).

These are real, clickable search URLs on partner sites. Affiliate tracking ids
are appended automatically when configured (BOOKING_AID — see
app/providers/util.booking_affiliate_params); otherwise links stay plain.
"""
from __future__ import annotations

from urllib.parse import quote_plus, urlencode

from app import schemas
from app.providers.util import booking_affiliate_params
from app.services import schedule as schedule_service


def _city_label(city_id: str | None) -> str:
    """'City, Country' so a hotel search geo-resolves to the right place."""
    if not city_id:
        return ""
    city = schedule_service.get_city(city_id)
    return f"{city.name}, {city.country}" if city else city_id


def deep_link_for(item: schemas.TripItem) -> str:
    if item.kind == "hotel":
        params = {
            "ss": _city_label(item.city_id) or item.title,
            **booking_affiliate_params(),
        }
        return "https://www.booking.com/searchresults.html?" + urlencode(params)
    if item.kind == "flight":
        return f"https://www.google.com/travel/flights?q={quote_plus(item.title)}"
    if item.kind == "transport":
        return f"https://www.rome2rio.com/s/{quote_plus(item.title)}"
    # Matches link out to a ticket search.
    return (
        "https://www.google.com/search?q="
        + quote_plus(f"{item.title} 2026 FIFA World Cup tickets")
    )
