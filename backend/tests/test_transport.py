from fastapi.testclient import TestClient


def test_transport_search_returns_all_modes(client: TestClient) -> None:
    res = client.post(
        "/transport/search",
        json={
            "origin": "Newark",
            "destination": "MetLife Stadium",
            "date": "2026-06-20",
        },
    )
    assert res.status_code == 200
    assert len(res.json()) == 5


def test_transport_search_respects_mode_filter(client: TestClient) -> None:
    res = client.post(
        "/transport/search",
        json={
            "origin": "A",
            "destination": "B",
            "date": "2026-06-20",
            "mode": "train",
        },
    )
    offers = res.json()
    assert len(offers) == 1
    assert offers[0]["mode"] == "train"
