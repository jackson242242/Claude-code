"""Shared helpers for the provider implementations."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from app.seed import schedule_2026 as _seed

# city_id -> "City, Country" — used to geo-anchor partner search links so a
# generic hotel name can't resolve to the wrong country.
_CITY_LABELS: dict[str, str] = {
    str(city["id"]): f"{city['name']}, {city['country']}" for city in _seed.CITIES
}


def city_label(city_id: str) -> str:
    """Return a 'City, Country' destination label for ``city_id``."""
    return _CITY_LABELS.get(city_id, city_id)


def booking_affiliate_params() -> dict[str, str]:
    """Booking.com Affiliate Partner Programme tracking params.

    Reads ``BOOKING_AID`` at call time (the affiliate id from
    booking.com/affiliate-program). Empty when unset — links stay plain,
    they just earn no commission.
    """
    aid = os.environ.get("BOOKING_AID", "").strip()
    return {"aid": aid} if aid else {}


def kayak_flights_link(
    origin: str, destination: str, date: str, passengers: int
) -> str:
    """Build a Kayak flight-results deep link, affiliate-tagged when
    ``KAYAK_AFFILIATE_ID`` (from affiliates.kayak.com) is set."""
    url = (
        f"https://www.kayak.com/flights/"
        f"{origin.upper()}-{destination.upper()}/{date}/"
        f"{max(1, passengers)}adults"
    )
    affiliate = os.environ.get("KAYAK_AFFILIATE_ID", "").strip()
    return f"{url}?{urlencode({'a': affiliate})}" if affiliate else url


def booking_hotel_link(
    destination: str, check_in: str, check_out: str, guests: int
) -> str:
    """Build a geo-anchored Booking.com search URL.

    ``destination`` MUST carry the city (e.g. ``"Mexico City, Mexico"``).
    Passing a bare hotel/brand name makes Booking.com free-text-resolve it
    globally and land users in the wrong country — the exact class of bug this
    helper exists to prevent. Audited by ``/meta/link-audit``.
    Affiliate-tagged (aid) when BOOKING_AID is configured.
    """
    return "https://www.booking.com/searchresults.html?" + urlencode(
        {
            "ss": destination,
            "checkin": check_in,
            "checkout": check_out,
            "group_adults": max(1, guests),
            **booking_affiliate_params(),
        }
    )


def seeded_int(seed: str, low: int, high: int) -> int:
    """Stable FNV-1a-based pseudo-random integer in [low, high] from a seed."""
    value = 2166136261
    for char in seed:
        value ^= ord(char)
        value = (value * 16777619) & 0xFFFFFFFF
    return low + (value % (high - low + 1))


def _iso(moment: datetime) -> str:
    return moment.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def leg(date: str, start_hour: int, duration_minutes: int) -> tuple[str, str]:
    """Returns (departUtc, arriveUtc) ISO strings for a travel leg."""
    year, month, day = (int(part) for part in date.split("-"))
    depart = datetime(year, month, day, start_hour, 0, 0, tzinfo=timezone.utc)
    arrive = depart + timedelta(minutes=duration_minutes)
    return _iso(depart), _iso(arrive)
