import uuid

from fastapi.testclient import TestClient


def _user_headers() -> dict[str, str]:
    return {"X-User-Id": uuid.uuid4().hex}


def test_me_requires_user_header(client: TestClient) -> None:
    res = client.get("/me")
    assert res.status_code == 401
    assert res.json()["error"]["type"] == "http_error"


def test_me_creates_a_guest_user(client: TestClient) -> None:
    res = client.get("/me", headers=_user_headers())
    assert res.status_code == 200
    body = res.json()
    assert body["displayName"].startswith("Guest ")
    assert "createdAt" in body


def test_trip_lifecycle_and_totals(client: TestClient) -> None:
    headers = _user_headers()

    created = client.post("/trips", json={"name": "Group stage run"}, headers=headers)
    assert created.status_code == 201
    trip = created.json()
    trip_id = trip["id"]
    assert trip["name"] == "Group stage run"
    assert trip["shareToken"]
    assert trip["itemCount"] == 0

    # Add a match item.
    add = client.post(
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
    assert add.status_code == 201

    # Add a hotel item with a price.
    add_hotel = client.post(
        f"/trips/{trip_id}/items",
        json={
            "kind": "hotel",
            "cityId": "mexico-city",
            "title": "Grand Plaza",
            "priceUsd": 540.0,
        },
        headers=headers,
    )
    assert add_hotel.status_code == 201
    body = add_hotel.json()
    assert body["itemCount"] == 2
    assert body["totalUsd"] == 540.0

    # List shows the trip with the right counts.
    listing = client.get("/trips", headers=headers).json()
    assert len(listing) == 1
    assert listing[0]["itemCount"] == 2
    assert listing[0]["totalUsd"] == 540.0


def test_trip_ownership_is_enforced(client: TestClient) -> None:
    owner = _user_headers()
    other = _user_headers()
    trip_id = client.post("/trips", json={"name": "Mine"}, headers=owner).json()["id"]

    assert client.get(f"/trips/{trip_id}", headers=owner).status_code == 200
    assert client.get(f"/trips/{trip_id}", headers=other).status_code == 404


def test_rename_and_delete_trip(client: TestClient) -> None:
    headers = _user_headers()
    trip_id = client.post("/trips", json={"name": "Old"}, headers=headers).json()["id"]

    renamed = client.patch(
        f"/trips/{trip_id}", json={"name": "New name"}, headers=headers
    )
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "New name"

    deleted = client.delete(f"/trips/{trip_id}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True
    assert client.get(f"/trips/{trip_id}", headers=headers).status_code == 404


def test_remove_item(client: TestClient) -> None:
    headers = _user_headers()
    trip_id = client.post("/trips", json={"name": "T"}, headers=headers).json()["id"]
    trip = client.post(
        f"/trips/{trip_id}/items",
        json={"kind": "match", "matchId": "M1", "title": "Opener"},
        headers=headers,
    ).json()
    item_id = trip["items"][0]["id"]

    removed = client.delete(f"/trips/{trip_id}/items/{item_id}", headers=headers)
    assert removed.status_code == 200
    assert removed.json()["itemCount"] == 0

    missing = client.delete(f"/trips/{trip_id}/items/{item_id}", headers=headers)
    assert missing.status_code == 404


def test_shared_trip_is_readable_without_auth(client: TestClient) -> None:
    headers = _user_headers()
    trip = client.post("/trips", json={"name": "Shareable"}, headers=headers).json()
    share_token = trip["shareToken"]

    res = client.get(f"/shared/{share_token}")
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Shareable"
    # The public share link must never expose the owner's user id (which is the
    # X-User-Id auth credential) or the share token itself.
    assert "userId" not in body
    assert "shareToken" not in body

    assert client.get("/shared/not-a-real-token").status_code == 404


def test_itinerary_suggestions(client: TestClient) -> None:
    headers = _user_headers()
    trip_id = client.post("/trips", json={"name": "Two cities"}, headers=headers).json()[
        "id"
    ]
    # M1 is in Mexico City; pick a later match in a different city.
    client.post(
        f"/trips/{trip_id}/items",
        json={"kind": "match", "matchId": "M1", "title": "Mexico City match"},
        headers=headers,
    )
    client.post(
        f"/trips/{trip_id}/items",
        json={"kind": "match", "matchId": "M104", "title": "Final at MetLife"},
        headers=headers,
    )

    res = client.get(f"/trips/{trip_id}/suggestions", headers=headers)
    assert res.status_code == 200
    body = res.json()
    # Two different host cities -> two stays and one travel leg between them.
    assert len(body["cityStays"]) == 2
    assert len(body["legs"]) == 1
    leg = body["legs"][0]
    assert leg["fromCityId"] == "mexico-city"
    assert leg["toCityId"] == "new-york"
    assert leg["flight"] is not None
    assert body["cityStays"][0]["hotel"] is not None
