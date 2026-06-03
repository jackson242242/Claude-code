"""Builds partner search deep links for booking lines (affiliate model).

These are real, clickable search URLs on partner sites — no affiliate ids are
attached here, but this is where they would be added per partner agreement.
"""
from __future__ import annotations

from urllib.parse import quote_plus

from app import schemas
from app.services import schedule as schedule_service


def _city_name(city_id: str | None) -> str:
    if not city_id:
        return ""
    city = schedule_service.get_city(city_id)
    return city.name if city else city_id


def deep_link_for(item: schemas.TripItem) -> str:
    if item.kind == "hotel":
        query = quote_plus(_city_name(item.city_id) or item.title)
        return f"https://www.booking.com/searchresults.html?ss={query}"
    if item.kind == "flight":
        return f"https://www.google.com/travel/flights?q={quote_plus(item.title)}"
    if item.kind == "transport":
        return f"https://www.rome2rio.com/s/{quote_plus(item.title)}"
    # Matches link out to a ticket search.
    return (
        "https://www.google.com/search?q="
        + quote_plus(f"{item.title} 2026 FIFA World Cup tickets")
    )
