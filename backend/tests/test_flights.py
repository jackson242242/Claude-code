from fastapi.testclient import TestClient


def test_flight_search_returns_offers(client: TestClient) -> None:
    res = client.post(
        "/flights/search",
        json={
            "origin": "lhr",
            "destination": "jfk",
            "date": "2026-06-20",
            "passengers": 2,
        },
    )
    assert res.status_code == 200
    offers = res.json()
    assert len(offers) == 5
    assert offers[0]["type"] == "flight"
    assert offers[0]["origin"] == "LHR"
    assert all(offer["priceUsd"] > 0 for offer in offers)


def test_flight_search_validation_error_is_structured(client: TestClient) -> None:
    res = client.post("/flights/search", json={"origin": "LHR"})
    assert res.status_code == 422
    assert res.json()["error"]["type"] == "validation_error"
