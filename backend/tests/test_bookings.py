import uuid

from fastapi.testclient import TestClient


def _headers() -> dict[str, str]:
    return {"X-User-Id": uuid.uuid4().hex}


def _trip_with_items(client: TestClient, headers: dict[str, str]) -> str:
    trip_id = client.post(
        "/trips", json={"name": "Checkout trip"}, headers=headers
    ).json()["id"]
    client.post(
        f"/trips/{trip_id}/items",
        json={
            "kind": "match",
            "matchId": "M1",
            "cityId": "mexico-city",
            "title": "Mexico vs Argentina",
            "startsAt": "2026-06-11T13:00:00",
        },
        headers=headers,
    )
    client.post(
        f"/trips/{trip_id}/items",
        json={
            "kind": "hotel",
            "cityId": "mexico-city",
            "title": "Grand Plaza",
            "priceUsd": 540.0,
        },
        headers=headers,
    )
    return trip_id


def test_checkout_creates_booking_with_deep_links(client: TestClient) -> None:
    headers = _headers()
    trip_id = _trip_with_items(client, headers)

    res = client.post(f"/trips/{trip_id}/checkout", headers=headers)
    assert res.status_code == 201
    booking = res.json()
    assert booking["status"] == "reserved"
    assert booking["paymentProvider"] == "none"
    assert booking["confirmationCode"].startswith("WC-")
    assert booking["totalUsd"] == 540.0
    assert len(booking["lines"]) == 2

    hotel_line = next(line for line in booking["lines"] if line["kind"] == "hotel")
    assert "booking.com" in hotel_line["deepLink"]
    match_line = next(line for line in booking["lines"] if line["kind"] == "match")
    assert match_line["deepLink"].startswith("https://")


def test_cannot_checkout_empty_trip(client: TestClient) -> None:
    headers = _headers()
    trip_id = client.post("/trips", json={"name": "Empty"}, headers=headers).json()[
        "id"
    ]
    res = client.post(f"/trips/{trip_id}/checkout", headers=headers)
    assert res.status_code == 400
    assert res.json()["error"]["type"] == "http_error"


def test_list_and_get_booking(client: TestClient) -> None:
    headers = _headers()
    trip_id = _trip_with_items(client, headers)
    booking = client.post(f"/trips/{trip_id}/checkout", headers=headers).json()

    listing = client.get("/bookings", headers=headers).json()
    assert len(listing) == 1
    assert listing[0]["confirmationCode"] == booking["confirmationCode"]
    assert listing[0]["lineCount"] == 2

    got = client.get(f"/bookings/{booking['id']}", headers=headers)
    assert got.status_code == 200
    assert got.json()["id"] == booking["id"]


def test_booking_ownership_enforced(client: TestClient) -> None:
    headers = _headers()
    other = _headers()
    trip_id = _trip_with_items(client, headers)
    booking_id = client.post(
        f"/trips/{trip_id}/checkout", headers=headers
    ).json()["id"]

    assert client.get(f"/bookings/{booking_id}", headers=other).status_code == 404
