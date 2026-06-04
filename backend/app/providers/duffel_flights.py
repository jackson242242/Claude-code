"""Concrete real-world flight adapter for the Duffel API.

Activated when FLIGHT_PROVIDER=duffel and DUFFEL_API_KEY is set. It maps a
Duffel offer request/response onto our normalized FlightOffer schema. The
registry wraps it with the resilient fallback so any upstream issue degrades to
the mock provider rather than failing the request.
"""
from __future__ import annotations

from datetime import datetime
from urllib.parse import urlencode

import httpx

from app import schemas
from app.providers.base import FlightProvider


def _parse_iso(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


def _duration_minutes(depart: str, arrive: str) -> int:
    start = _parse_iso(depart)
    end = _parse_iso(arrive)
    if start is None or end is None:
        return 0
    return max(0, int((end - start).total_seconds() // 60))


class DuffelFlightProvider(FlightProvider):
    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = "https://api.duffel.com",
        timeout: float = 6.0,
        client: httpx.Client | None = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._client = client

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Duffel-Version": "v2",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def search(
        self, query: schemas.FlightSearchQuery
    ) -> list[schemas.FlightOffer]:
        body = {
            "data": {
                "slices": [
                    {
                        "origin": query.origin.upper(),
                        "destination": query.destination.upper(),
                        "departure_date": query.date,
                    }
                ],
                "passengers": [{"type": "adult"} for _ in range(max(1, query.passengers))],
                "cabin_class": "economy",
            }
        }
        client = self._client or httpx.Client(timeout=self._timeout)
        try:
            response = client.post(
                f"{self._base_url}/air/offer_requests",
                params={"return_offers": "true"},
                json=body,
                headers=self._headers(),
            )
            response.raise_for_status()
            offers = response.json().get("data", {}).get("offers", [])
        finally:
            if self._client is None:
                client.close()

        return [self._normalize(offer, query) for offer in offers]

    def _normalize(
        self, offer: dict[str, object], query: schemas.FlightSearchQuery
    ) -> schemas.FlightOffer:
        slices = offer.get("slices", []) if isinstance(offer, dict) else []
        segments = []
        for slice_ in slices:
            if isinstance(slice_, dict):
                segments.extend(slice_.get("segments", []))
        first = segments[0] if segments else {}
        last = segments[-1] if segments else {}
        depart = str(first.get("departing_at", "")) if isinstance(first, dict) else ""
        arrive = str(last.get("arriving_at", "")) if isinstance(last, dict) else ""
        owner = offer.get("owner", {}) if isinstance(offer, dict) else {}
        airline = str(owner.get("name", "Unknown")) if isinstance(owner, dict) else "Unknown"

        return schemas.FlightOffer(
            id=f"duffel-{offer.get('id', '')}",
            provider="Duffel",
            airline=airline,
            origin=query.origin.upper(),
            destination=query.destination.upper(),
            depart_utc=depart,
            arrive_utc=arrive,
            duration_minutes=_duration_minutes(depart, arrive),
            stops=max(0, len(segments) - 1),
            # Amount is treated as USD (Duffel test accounts are USD-denominated).
            # Multi-currency normalization via `total_currency` is a tracked follow-up.
            price_usd=float(offer.get("total_amount", 0) or 0),
            deep_link=(
                f"https://www.kayak.com/flights/"
                f"{query.origin.upper()}-{query.destination.upper()}/"
                f"{query.date}/{max(1, query.passengers)}adults"
            ),
        )
