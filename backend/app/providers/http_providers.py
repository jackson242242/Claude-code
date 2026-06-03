"""Generic "bring your own service" HTTP providers.

Each posts the search query (camelCase JSON) to a configured endpoint and
expects back a JSON array of offers already in our normalized schema. This is
the integration seam for any compliant microservice; concrete branded adapters
(e.g. Duffel) live in their own modules.
"""
from __future__ import annotations

import httpx

from app import schemas
from app.providers.base import FlightProvider, HotelProvider, TransportProvider


def _headers(api_key: str | None) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}"} if api_key else {}


class _HttpProvider:
    def __init__(
        self,
        base_url: str,
        api_key: str | None = None,
        *,
        timeout: float = 6.0,
        client: httpx.Client | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._timeout = timeout
        self._client = client

    def _post(self, path: str, query: schemas.CamelModel) -> list[dict[str, object]]:
        client = self._client or httpx.Client(timeout=self._timeout)
        try:
            response = client.post(
                f"{self._base_url}{path}",
                json=query.model_dump(by_alias=True),
                headers=_headers(self._api_key),
            )
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, list):
                raise ValueError("expected a JSON array of offers")
            return payload
        finally:
            if self._client is None:
                client.close()


class HttpFlightProvider(_HttpProvider, FlightProvider):
    def search(
        self, query: schemas.FlightSearchQuery
    ) -> list[schemas.FlightOffer]:
        return [
            schemas.FlightOffer(**offer)
            for offer in self._post("/flights/search", query)
        ]


class HttpHotelProvider(_HttpProvider, HotelProvider):
    def search(self, query: schemas.HotelSearchQuery) -> list[schemas.HotelOffer]:
        return [
            schemas.HotelOffer(**offer)
            for offer in self._post("/hotels/search", query)
        ]


class HttpTransportProvider(_HttpProvider, TransportProvider):
    def search(
        self, query: schemas.TransportSearchQuery
    ) -> list[schemas.TransportOffer]:
        return [
            schemas.TransportOffer(**offer)
            for offer in self._post("/transport/search", query)
        ]
