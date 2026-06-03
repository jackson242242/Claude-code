from fastapi.testclient import TestClient


def test_hotel_search_returns_offers(client: TestClient) -> None:
    res = client.post(
        "/hotels/search",
        json={
            "cityId": "miami",
            "checkIn": "2026-06-20",
            "checkOut": "2026-06-23",
            "guests": 2,
        },
    )
    assert res.status_code == 200
    offers = res.json()
    assert len(offers) == 5
    assert all(offer["type"] == "hotel" for offer in offers)
    assert all(offer["nights"] == 3 for offer in offers)
    assert all(offer["cityId"] == "miami" for offer in offers)
