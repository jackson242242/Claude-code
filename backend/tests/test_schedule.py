from fastapi.testclient import TestClient


def test_matches_returns_full_schedule(client: TestClient) -> None:
    res = client.get("/matches")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 104
    # camelCase keys confirm alias serialization matches the TS contract.
    assert "matchNumber" in data[0]
    opener = next(m for m in data if m["matchNumber"] == 1)
    assert opener["venueId"] == "mexico-city"
    assert opener["homeTeam"] == "Mexico"


def test_matches_filter_by_group(client: TestClient) -> None:
    assert len(client.get("/matches", params={"group": "A"}).json()) == 6


def test_matches_filter_by_stage(client: TestClient) -> None:
    assert len(client.get("/matches", params={"stage": "Final"}).json()) == 1


def test_get_match_by_id(client: TestClient) -> None:
    res = client.get("/matches/M1")
    assert res.status_code == 200
    body = res.json()
    assert body["id"] == "M1"
    assert body["venueId"] == "mexico-city"


def test_unknown_match_returns_structured_404(client: TestClient) -> None:
    res = client.get("/matches/UNKNOWN")
    assert res.status_code == 404
    assert res.json()["error"]["type"] == "http_error"


def test_cities_and_teams(client: TestClient) -> None:
    assert len(client.get("/cities").json()) == 16
    assert len(client.get("/teams").json()) == 48
    city = client.get("/cities/new-york").json()
    assert city["name"].startswith("New York")
