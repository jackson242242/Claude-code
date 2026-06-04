"""Concrete real-world hotel adapter for the LiteAPI (Nuitée) hotel API.

Activated when ``HOTEL_PROVIDER=liteapi`` and ``LITEAPI_API_KEY`` is set. Unlike
Duffel Stays (which is sales-gated), LiteAPI offers instant self-serve sandbox
access, so hotels can go live without waiting on an approval.

LiteAPI separates *content* from *pricing*, so a search is two calls:
  1. ``GET  /data/hotels``  — hotels near coordinates (id, name, starRating, coords)
  2. ``POST /hotels/rates`` — cheapest live rate per hotelId for the dates/occupancy

The registry injects a ``locate`` callable resolving our ``city_id`` to
``(lat, lng)`` from the 2026 host-city seed (same as the Duffel Stays adapter).
Results map onto our normalized ``HotelOffer``; the registry wraps this with the
resilient fallback to mock so any upstream issue degrades gracefully.

Note: amounts are treated as USD (we request ``currency=USD``). Multi-currency
normalization is a tracked follow-up, shared with the flight adapter.
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

# Cap the content list before pricing so a dense city stays one light request.
_MAX_HOTELS = 30


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


def _cheapest_total(hotel: dict) -> float:
    """Smallest positive retailRate total across all room types/rates."""
    amounts: list[float] = []
    for room in hotel.get("roomTypes", []) or []:
        if not isinstance(room, dict):
            continue
        for rate in room.get("rates", []) or []:
            if not isinstance(rate, dict):
                continue
            retail = rate.get("retailRate", {}) or {}
            for total in retail.get("total", []) or []:
                amount = total.get("amount") if isinstance(total, dict) else None
                if isinstance(amount, (int, float)) and amount > 0:
                    amounts.append(float(amount))
    return min(amounts) if amounts else 0.0


class LiteApiHotelProvider(HotelProvider):
    def __init__(
        self,
        api_key: str,
        locate: CityLocator,
        *,
        base_url: str = "https://api.liteapi.travel/v3.0",
        timeout: float = 6.0,
        radius_km: int = 8,
        currency: str = "USD",
        guest_nationality: str = "US",
        client: httpx.Client | None = None,
    ) -> None:
        self._api_key = api_key
        self._locate = locate
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._radius_km = radius_km
        self._currency = currency
        self._guest_nationality = guest_nationality
        self._client = client

    def _headers(self) -> dict[str, str]:
        return {
            "X-API-Key": self._api_key,
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
        client = self._client or httpx.Client(timeout=self._timeout)
        try:
            hotels = self._fetch_hotels(client, lat, lng)
            if not hotels:
                return []
            totals = self._fetch_rates(client, query, list(hotels.keys()))
        finally:
            if self._client is None:
                client.close()

        offers: list[schemas.HotelOffer] = []
        for hotel_id, total in totals.items():
            meta = hotels.get(hotel_id)
            if meta is None or total <= 0:
                continue
            offers.append(self._to_offer(meta, total, nights, query, (lat, lng)))
        return offers

    def _fetch_hotels(
        self, client: httpx.Client, lat: float, lng: float
    ) -> dict[str, dict]:
        """Content call: nearby hotels keyed by id with name/rating/coords."""
        response = client.get(
            f"{self._base_url}/data/hotels",
            params={
                "latitude": lat,
                "longitude": lng,
                "radius": int(self._radius_km * 1000),  # LiteAPI radius is metres
            },
            headers=self._headers(),
        )
        response.raise_for_status()
        data = response.json().get("data", []) or []
        hotels: dict[str, dict] = {}
        for item in data[:_MAX_HOTELS]:
            if not isinstance(item, dict):
                continue
            hotel_id = item.get("id") or item.get("hotelId")
            if hotel_id:
                hotels[str(hotel_id)] = item
        return hotels

    def _fetch_rates(
        self,
        client: httpx.Client,
        query: schemas.HotelSearchQuery,
        hotel_ids: list[str],
    ) -> dict[str, float]:
        """Pricing call: cheapest total per hotelId for the dates/occupancy."""
        body = {
            "hotelIds": hotel_ids,
            "occupancies": [{"adults": max(1, query.guests)}],
            "currency": self._currency,
            "guestNationality": self._guest_nationality,
            "checkin": query.check_in,
            "checkout": query.check_out,
        }
        response = client.post(
            f"{self._base_url}/hotels/rates", json=body, headers=self._headers()
        )
        response.raise_for_status()
        data = response.json().get("data", []) or []
        totals: dict[str, float] = {}
        for hotel in data:
            if not isinstance(hotel, dict):
                continue
            hotel_id = hotel.get("hotelId") or hotel.get("id")
            if not hotel_id:
                continue
            total = _cheapest_total(hotel)
            if total > 0:
                totals[str(hotel_id)] = total
        return totals

    def _to_offer(
        self,
        meta: dict,
        total: float,
        nights: int,
        query: schemas.HotelSearchQuery,
        city_coords: tuple[float, float],
    ) -> schemas.HotelOffer:
        # Prefer star rating (1–5); guest review scores use a different scale.
        rating_raw = meta.get("starRating") or meta.get("stars") or 3
        try:
            rating = max(1, min(5, int(round(float(rating_raw)))))
        except (TypeError, ValueError):
            rating = 3

        distance_km = 0.0
        lat = meta.get("latitude")
        lng = meta.get("longitude")
        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
            distance_km = _haversine_km(
                city_coords[0], city_coords[1], float(lat), float(lng)
            )

        return schemas.HotelOffer(
            id=f"liteapi-{meta.get('id') or meta.get('hotelId') or ''}",
            provider="LiteAPI",
            name=str(meta.get("name", "Hotel")),
            city_id=query.city_id,
            rating=rating,
            distance_km=distance_km,
            price_per_night_usd=round(total / nights, 2),
            nights=nights,
            price_usd=total,
        )
