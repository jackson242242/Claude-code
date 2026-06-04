from fastapi.testclient import TestClient

from app.services.geo import distance_km


def test_distance_km_known_pair() -> None:
    # New York to Los Angeles is roughly 3,900 km.
    assert 3800 < distance_km(40.71, -74.0, 34.05, -118.24) < 4100


def test_nearby_cities_sorted_and_closest_first(client: TestClient) -> None:
    res = client.get("/cities/new-york/nearby", params={"limit": 3})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 3
    distances = [city["distanceKm"] for city in data]
    assert distances == sorted(distances)
    # Philadelphia is the nearest host city to New York / New Jersey.
    assert data[0]["id"] == "philadelphia"


def test_nearby_unknown_city_returns_404(client: TestClient) -> None:
    assert client.get("/cities/nope/nearby").status_code == 404


def test_schedule_responses_carry_cache_header(client: TestClient) -> None:
    res = client.get("/matches")
    assert res.headers.get("Cache-Control") == "public, max-age=60"


def test_metrics_endpoint_counts_requests(client: TestClient) -> None:
    client.get("/health")
    res = client.get("/meta/metrics")
    assert res.status_code == 200
    body = res.json()
    assert body["totalRequests"] >= 1
    assert "byStatus" in body
    assert "byRoute" in body


def test_hotel_probe_reports_unconfigured_on_default(client: TestClient) -> None:
    # Default test config has no real hotel provider, so the probe says so
    # cleanly (rather than masking it behind the mock fallback).
    res = client.get("/meta/hotel-probe")
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is False
    assert body["configured"] == "mock"
