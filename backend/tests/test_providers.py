import json

import httpx
from fastapi.testclient import TestClient

from app import schemas
from app.providers.base import FlightProvider
from app.providers.cache import CachedFlightProvider, TtlCache
from app.providers.duffel_flights import DuffelFlightProvider
from app.providers.duffel_hotels import DuffelStaysHotelProvider
from app.providers.http_providers import HttpFlightProvider
from app.providers.resilient import ResilientFlightProvider

_QUERY = schemas.FlightSearchQuery(
    origin="lhr", destination="jfk", date="2026-06-20", passengers=1
)


def _offer(price: float = 100.0) -> schemas.FlightOffer:
    return schemas.FlightOffer(
        id="x",
        provider="test",
        airline="A",
        origin="LHR",
        destination="JFK",
        depart_utc="2026-06-20T10:00:00.000Z",
        arrive_utc="2026-06-20T13:00:00.000Z",
        duration_minutes=180,
        stops=0,
        price_usd=price,
    )


class _CountingProvider(FlightProvider):
    def __init__(self) -> None:
        self.calls = 0

    def search(self, query: schemas.FlightSearchQuery) -> list[schemas.FlightOffer]:
        self.calls += 1
        return [_offer()]


class _BoomProvider(FlightProvider):
    def search(self, query: schemas.FlightSearchQuery) -> list[schemas.FlightOffer]:
        raise RuntimeError("upstream down")


def test_ttl_cache_hit_and_expiry() -> None:
    inner = _CountingProvider()
    cached = CachedFlightProvider(inner, TtlCache(ttl_seconds=100))
    assert cached.search(_QUERY)[0].price_usd == 100.0
    cached.search(_QUERY)
    assert inner.calls == 1  # second call served from cache

    expiring = CachedFlightProvider(inner, TtlCache(ttl_seconds=-1))
    expiring.search(_QUERY)
    expiring.search(_QUERY)
    assert inner.calls == 3  # both calls missed the already-expired cache


def test_resilient_falls_back_to_mock_on_error() -> None:
    fallback = _CountingProvider()
    provider = ResilientFlightProvider(_BoomProvider(), fallback)
    result = provider.search(_QUERY)
    assert len(result) == 1
    assert fallback.calls == 1


def test_http_provider_normalizes_offers() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Authorization"] == "Bearer secret"
        return httpx.Response(
            200,
            json=[
                {
                    "id": "a1",
                    "type": "flight",
                    "provider": "PartnerAir",
                    "priceUsd": 321.0,
                    "origin": "LHR",
                    "destination": "JFK",
                    "airline": "Partner",
                    "departUtc": "2026-06-20T10:00:00.000Z",
                    "arriveUtc": "2026-06-20T13:00:00.000Z",
                    "durationMinutes": 180,
                    "stops": 0,
                }
            ],
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = HttpFlightProvider("https://svc.example", "secret", client=client)
    offers = provider.search(_QUERY)
    assert len(offers) == 1
    assert offers[0].provider == "PartnerAir"
    assert offers[0].price_usd == 321.0


def test_duffel_provider_maps_offer_request() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/air/offer_requests"
        assert request.headers["Authorization"] == "Bearer duffel-key"
        return httpx.Response(
            200,
            json={
                "data": {
                    "offers": [
                        {
                            "id": "off_123",
                            "total_amount": "450.50",
                            "total_currency": "USD",
                            "owner": {"name": "Test Air"},
                            "slices": [
                                {
                                    "segments": [
                                        {
                                            "departing_at": "2026-06-20T10:00:00",
                                            "arriving_at": "2026-06-20T13:30:00",
                                        }
                                    ]
                                }
                            ],
                        }
                    ]
                }
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = DuffelFlightProvider("duffel-key", client=client)
    offers = provider.search(_QUERY)
    assert len(offers) == 1
    offer = offers[0]
    assert offer.provider == "Duffel"
    assert offer.airline == "Test Air"
    assert offer.price_usd == 450.5
    assert offer.duration_minutes == 210
    assert offer.stops == 0


def test_meta_providers_defaults_to_mock(client: TestClient) -> None:
    res = client.get("/meta/providers")
    assert res.status_code == 200
    body = res.json()
    assert body["flights"]["mode"] == "mock"
    assert body["hotels"]["mode"] == "mock"
    assert body["transport"]["mode"] == "mock"


def test_duffel_stays_maps_hotel_results() -> None:
    query = schemas.HotelSearchQuery(
        city_id="miami", check_in="2026-06-20", check_out="2026-06-23", guests=2
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/stays/search"
        assert request.headers["Authorization"] == "Bearer duffel-key"
        coords = json.loads(request.content)["data"]["location"][
            "geographic_coordinates"
        ]
        assert coords == {"latitude": 25.958, "longitude": -80.239}
        return httpx.Response(
            200,
            json={
                "data": {
                    "results": [
                        {
                            "id": "res_1",
                            "cheapest_rate_total_amount": "600.00",
                            "cheapest_rate_total_currency": "USD",
                            "accommodation": {
                                "name": "Bayfront Hotel",
                                "rating": 4,
                                "location": {
                                    "geographic_coordinates": {
                                        "latitude": 25.97,
                                        "longitude": -80.24,
                                    }
                                },
                            },
                        },
                        # Zero-priced result is dropped.
                        {"id": "res_skip", "cheapest_rate_total_amount": "0"},
                    ]
                }
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = DuffelStaysHotelProvider(
        "duffel-key", lambda _city: (25.958, -80.239), client=client
    )
    offers = provider.search(query)
    assert len(offers) == 1
    offer = offers[0]
    assert offer.provider == "Duffel"
    assert offer.name == "Bayfront Hotel"
    assert offer.city_id == "miami"
    assert offer.rating == 4
    assert offer.nights == 3
    assert offer.price_usd == 600.0
    assert offer.price_per_night_usd == 200.0


def test_duffel_stays_returns_empty_for_unknown_city() -> None:
    query = schemas.HotelSearchQuery(
        city_id="atlantis", check_in="2026-06-20", check_out="2026-06-21"
    )
    provider = DuffelStaysHotelProvider("duffel-key", lambda _city: None)
    assert provider.search(query) == []
