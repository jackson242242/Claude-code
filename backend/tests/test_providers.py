import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app import schemas
from app.providers import registry
from app.providers.base import FlightProvider
from app.providers.cache import CachedFlightProvider, TtlCache
from app.providers.duffel_flights import DuffelFlightProvider
from app.providers.duffel_hotels import DuffelStaysHotelProvider
from app.providers.http_providers import HttpFlightProvider
from app.providers.liteapi_hotels import LiteApiHotelProvider
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


_PROBE_QUERY = schemas.HotelSearchQuery(
    city_id="new-york", check_in="2026-06-15", check_out="2026-06-18", guests=2
)


def _duffel_with(handler) -> DuffelStaysHotelProvider:
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return DuffelStaysHotelProvider("duffel-key", lambda _city: (40.7, -74.0), client=client)


def test_probe_hotels_surfaces_upstream_json_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            403, json={"errors": [{"type": "authentication_error", "title": "no Stays"}]}
        )

    monkeypatch.setattr(registry, "_hotel_primary", lambda: _duffel_with(handler))
    result = registry.probe_hotels(_PROBE_QUERY)
    assert result["ok"] is False
    assert result["status"] == 403
    assert result["upstreamError"]["errors"][0]["type"] == "authentication_error"


def test_probe_hotels_surfaces_non_json_error_body(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="upstream boom")

    monkeypatch.setattr(registry, "_hotel_primary", lambda: _duffel_with(handler))
    result = registry.probe_hotels(_PROBE_QUERY)
    assert result["ok"] is False
    assert result["status"] == 500
    assert result["upstreamError"] == "upstream boom"


def test_probe_hotels_reports_live_sample(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "data": {
                    "results": [
                        {
                            "id": "res_9",
                            "cheapest_rate_total_amount": "300.00",
                            "accommodation": {"name": "Probe Hotel", "rating": 5},
                        }
                    ]
                }
            },
        )

    monkeypatch.setattr(registry, "_hotel_primary", lambda: _duffel_with(handler))
    result = registry.probe_hotels(_PROBE_QUERY)
    assert result["ok"] is True
    assert result["count"] == 1
    assert result["sample"]["provider"] == "Duffel"
    assert result["sample"]["name"] == "Probe Hotel"


def test_probe_hotels_surfaces_generic_error(monkeypatch: pytest.MonkeyPatch) -> None:
    class _Boom:
        def search(self, _query: schemas.HotelSearchQuery) -> list[schemas.HotelOffer]:
            raise RuntimeError("kaboom")

    monkeypatch.setattr(registry, "_hotel_primary", lambda: _Boom())
    result = registry.probe_hotels(_PROBE_QUERY)
    assert result["ok"] is False
    assert "RuntimeError" in result["error"]


def test_probe_hotels_reports_unconfigured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(registry, "_hotel_primary", lambda: None)
    result = registry.probe_hotels(_PROBE_QUERY)
    assert result["ok"] is False
    assert "reason" in result


_PROBE_FLIGHT_QUERY = schemas.FlightSearchQuery(
    origin="jfk", destination="lax", date="2026-06-15", passengers=1
)


def _duffel_flights_with(handler) -> DuffelFlightProvider:
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return DuffelFlightProvider("duffel-key", client=client)


def test_probe_flights_surfaces_upstream_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"errors": [{"type": "invalid_state"}]})

    monkeypatch.setattr(registry, "_flight_primary", lambda: _duffel_flights_with(handler))
    result = registry.probe_flights(_PROBE_FLIGHT_QUERY)
    assert result["ok"] is False
    assert result["status"] == 403
    assert result["upstreamError"]["errors"][0]["type"] == "invalid_state"


def test_probe_flights_reports_live_sample(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "data": {
                    "offers": [
                        {
                            "id": "off_1",
                            "total_amount": "199.00",
                            "owner": {"name": "Test Air"},
                            "slices": [
                                {
                                    "segments": [
                                        {
                                            "departing_at": "2026-06-15T08:00:00",
                                            "arriving_at": "2026-06-15T11:00:00",
                                        }
                                    ]
                                }
                            ],
                        }
                    ]
                }
            },
        )

    monkeypatch.setattr(registry, "_flight_primary", lambda: _duffel_flights_with(handler))
    result = registry.probe_flights(_PROBE_FLIGHT_QUERY)
    assert result["ok"] is True
    assert result["count"] == 1
    assert result["sample"]["provider"] == "Duffel"
    assert result["sample"]["airline"] == "Test Air"


def test_probe_flights_reports_unconfigured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(registry, "_flight_primary", lambda: None)
    result = registry.probe_flights(_PROBE_FLIGHT_QUERY)
    assert result["ok"] is False
    assert "reason" in result


_LITE_QUERY = schemas.HotelSearchQuery(
    city_id="miami", check_in="2026-06-20", check_out="2026-06-23", guests=2
)


def _liteapi_with(handler) -> LiteApiHotelProvider:
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return LiteApiHotelProvider("lite-key", lambda _city: (25.958, -80.239), client=client)


def _rate(hotel_id: str, amount: float) -> dict:
    return {
        "hotelId": hotel_id,
        "roomTypes": [
            {"rates": [{"retailRate": {"total": [{"amount": amount, "currency": "USD"}]}}]}
        ],
    }


def test_liteapi_maps_hotel_results() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["X-API-Key"] == "lite-key"
        if request.url.path.endswith("/data/hotels"):
            assert "latitude" in request.url.params
            return httpx.Response(
                200,
                json={
                    "data": [
                        {"id": "lp1", "name": "Ocean View", "starRating": 4,
                         "latitude": 25.97, "longitude": -80.24},
                        {"id": "lp2", "name": "Budget Inn", "starRating": 3,
                         "latitude": 25.9, "longitude": -80.2},
                    ]
                },
            )
        if request.url.path.endswith("/hotels/rates"):
            body = json.loads(request.content)
            assert body["checkin"] == "2026-06-20"
            assert body["occupancies"] == [{"adults": 2}]
            assert set(body["hotelIds"]) == {"lp1", "lp2"}
            return httpx.Response(200, json={"data": [_rate("lp1", 600.0), _rate("lp2", 300.0)]})
        return httpx.Response(404)

    offers = _liteapi_with(handler).search(_LITE_QUERY)
    by_name = {o.name: o for o in offers}
    assert set(by_name) == {"Ocean View", "Budget Inn"}
    ocean = by_name["Ocean View"]
    assert ocean.provider == "LiteAPI"
    assert ocean.price_usd == 600.0
    assert ocean.nights == 3
    assert ocean.price_per_night_usd == 200.0
    assert ocean.rating == 4
    assert ocean.city_id == "miami"


def test_liteapi_skips_hotels_without_a_rate() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/data/hotels"):
            return httpx.Response(
                200,
                json={
                    "data": [
                        {"id": "lp1", "name": "Priced", "starRating": 5,
                         "latitude": 25.97, "longitude": -80.24},
                        {"id": "lp2", "name": "Unpriced", "starRating": 3,
                         "latitude": 25.9, "longitude": -80.2},
                    ]
                },
            )
        return httpx.Response(200, json={"data": [_rate("lp1", 450.0)]})

    offers = _liteapi_with(handler).search(_LITE_QUERY)
    assert len(offers) == 1
    assert offers[0].name == "Priced"
    assert offers[0].price_usd == 450.0


def test_liteapi_defaults_rating_and_distance_when_missing() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/data/hotels"):
            return httpx.Response(200, json={"data": [{"id": "lp9", "name": "Sparse"}]})
        return httpx.Response(200, json={"data": [_rate("lp9", 150.0)]})

    offers = _liteapi_with(handler).search(_LITE_QUERY)
    assert len(offers) == 1
    assert offers[0].rating == 3
    assert offers[0].distance_km == 0.0


def test_liteapi_returns_empty_for_unknown_city() -> None:
    provider = LiteApiHotelProvider("lite-key", lambda _city: None)
    query = schemas.HotelSearchQuery(
        city_id="atlantis", check_in="2026-06-20", check_out="2026-06-21"
    )
    assert provider.search(query) == []


def test_liteapi_propagates_http_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": {"code": 401}})

    with pytest.raises(httpx.HTTPStatusError):
        _liteapi_with(handler).search(_LITE_QUERY)
