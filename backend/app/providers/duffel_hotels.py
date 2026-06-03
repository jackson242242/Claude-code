"""Concrete real-world hotel adapter for the Duffel Stays API.

Activated when ``HOTEL_PROVIDER=duffel`` and ``DUFFEL_API_KEY`` is set. Duffel
Stays searches by geographic coordinates, so the registry injects a ``locate``
callable that resolves our ``city_id`` to ``(lat, lng)`` from the 2026 host-city
seed. Results map onto our normalized ``HotelOffer`` schema; the registry wraps
this with the resilient fallback to mock so any upstream issue degrades to the
deterministic provider rather than failing the request.

Note: amounts are treated as USD. Duffel test accounts are USD-denominated, so
the demo is correct; production multi-currency (CAD/MXN via FX normalization) is
a tracked follow-up because our trip/booking totals sum in a single currency.
"""
from __future__ import annotations

from collections.abc import Callable
from datetime import date
from math import asin, cos, radians, sin, sqrt

import httpx

from app import schemas
from app.providers.base import HotelProvider

# Resolves a city_id to its (latitude, longitude), or None if unknown.
CityLocator = Callable[[str], "tuple[float, float] | None"]


def _nights(check_in: str, check_out: str) -> int:
    try:
        start = date.fromisoformat(check_in)
        end = date.fromisoformat(check_out)
    except ValueError:
        return 1
    return max(1, (end - start).days)


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    )
    return round(2 * radius * asin(sqrt(a)), 1)


class DuffelStaysHotelProvider(HotelProvider):
    def __init__(
        self,
        api_key: str,
        locate: CityLocator,
        *,
        base_url: str = "https://api.duffel.com",
        timeout: float = 6.0,
        radius_km: int = 8,
        client: httpx.Client | None = None,
    ) -> None:
        self._api_key = api_key
        self._locate = locate
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._radius_km = radius_km
        self._client = client

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Duffel-Version": "v2",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def search(self, query: schemas.HotelSearchQuery) -> list[schemas.HotelOffer]:
        coords = self._locate(query.city_id)
        if coords is None:
            # Unknown city — let the resilient wrapper fall back to mock.
            return []
        lat, lng = coords
        nights = _nights(query.check_in, query.check_out)
        body = {
            "data": {
                "rooms": 1,
                "guests": [
                    {"type": "adult"} for _ in range(max(1, query.guests))
                ],
                "check_in_date": query.check_in,
                "check_out_date": query.check_out,
                "location": {
                    "radius": self._radius_km,
                    "geographic_coordinates": {"latitude": lat, "longitude": lng},
                },
            }
        }
        client = self._client or httpx.Client(timeout=self._timeout)
        try:
            response = client.post(
                f"{self._base_url}/stays/search",
                json=body,
                headers=self._headers(),
            )
            response.raise_for_status()
            results = response.json().get("data", {}).get("results", [])
        finally:
            if self._client is None:
                client.close()

        offers = (
            self._normalize(result, query, nights, (lat, lng)) for result in results
        )
        return [offer for offer in offers if offer is not None]

    def _normalize(
        self,
        result: object,
        query: schemas.HotelSearchQuery,
        nights: int,
        city_coords: tuple[float, float],
    ) -> schemas.HotelOffer | None:
        if not isinstance(result, dict):
            return None
        total = float(result.get("cheapest_rate_total_amount", 0) or 0)
        if total <= 0:
            return None
        acc = result.get("accommodation", {})
        if not isinstance(acc, dict):
            acc = {}

        # Star rating is an int; fall back to a rounded /10 guest score, else 3.
        rating = acc.get("rating")
        if rating is None:
            review = acc.get("review_score")
            rating = round(float(review) / 2) if review else 3
        rating = max(1, min(5, int(rating)))

        # Distance from city center, when the accommodation exposes coordinates.
        distance_km = 0.0
        location = acc.get("location", {})
        geo = location.get("geographic_coordinates", {}) if isinstance(location, dict) else {}
        if isinstance(geo, dict) and "latitude" in geo and "longitude" in geo:
            try:
                distance_km = _haversine_km(
                    city_coords[0],
                    city_coords[1],
                    float(geo["latitude"]),
                    float(geo["longitude"]),
                )
            except (TypeError, ValueError):
                distance_km = 0.0

        return schemas.HotelOffer(
            id=f"duffel-{result.get('id', '')}",
            provider="Duffel",
            name=str(acc.get("name", "Hotel")),
            city_id=query.city_id,
            rating=rating,
            distance_km=distance_km,
            price_per_night_usd=round(total / nights, 2),
            nights=nights,
            price_usd=total,
        )
