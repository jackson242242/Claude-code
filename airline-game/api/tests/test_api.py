"""End-to-end smoke tests over the FastAPI layer (TestClient), covering the
full flow: create game → buy → open route → assign → end turn → bankruptcy."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    # raise_server_exceptions=False lets the global handlers shape 500s too.
    return TestClient(app, raise_server_exceptions=False)


def create_game(client, name="Smoke Air", hq="nyc") -> dict:
    response = client.post("/api/games", json={"airlineName": name, "hqCityId": hq})
    assert response.status_code == 201
    return response.json()


def assert_error_envelope(response, status, error_type=None):
    assert response.status_code == status
    body = response.json()
    assert set(body) == {"error"}
    assert "message" in body["error"] and "type" in body["error"]
    if error_type:
        assert body["error"]["type"] == error_type


class TestMeta:
    def test_meta_serves_data_tables_in_camel_case(self, client):
        body = client.get("/api/meta").json()
        assert len(body["cities"]) == 95   # loaded from cities.json (additive)
        assert len(body["aircraftModels"]) == 19  # loaded from aircraft.json (additive)
        nyc = next(c for c in body["cities"] if c["id"] == "nyc")
        assert nyc["nameZh"] == "纽约"
        assert nyc["demandIndex"] == 10 and nyc["slotFee"] == 9500
        assert nyc["slotCapacity"] == 12  # M2.2 slot pool on the wire
        a320 = next(m for m in body["aircraftModels"] if m["id"] == "a320neo")
        assert a320["rangeKm"] == 6300 and a320["fuelKgPerKm"] == 2.5
        b777_9 = next(m for m in body["aircraftModels"] if m["id"] == "b777-9")
        assert b777_9["badge"] == "2026 新机型"


class TestGameLifecycle:
    def test_create_and_fetch_game(self, client):
        state = create_game(client)
        assert state["airlineName"] == "Smoke Air"
        assert state["hqCityId"] == "nyc"
        assert (state["turn"], state["year"], state["quarter"]) == (1, 2026, 3)
        assert state["cash"] == 420_000_000
        assert state["fleet"] == [] and state["routes"] == []
        assert state["status"] == "active"
        assert state["finance"] == {"lastQuarter": None, "history": []}
        assert state["news"][0]["kind"] == "system"
        # M2.2: the slot market snapshot covers every city; the player starts
        # holding 2 slots at the HQ and 0 elsewhere.
        assert len(state["slotMarket"]) == 95  # all cities in cities.json
        assert state["slotMarket"]["nyc"] == {
            "capacity": 12,
            "taken": 2,  # the 2 HQ-held slots; no AI route touches nyc
            "playerHeld": 2,
            "playerUsed": 0,
        }
        assert state["slotMarket"]["lax"] == {
            "capacity": 11,
            "taken": 0,
            "playerHeld": 0,
            "playerUsed": 0,
        }

        fetched = client.get(f"/api/games/{state['id']}").json()
        assert fetched == state

    def test_create_with_unknown_city_is_400(self, client):
        response = client.post(
            "/api/games", json={"airlineName": "X", "hqCityId": "narnia"}
        )
        assert_error_envelope(response, 400, "invalid_request")

    def test_unknown_game_is_404(self, client):
        assert_error_envelope(client.get("/api/games/g-999999"), 404, "not_found")
        response = client.post("/api/games/g-999999/end-turn", json={})
        assert_error_envelope(response, 404, "not_found")

    def test_malformed_body_is_422(self, client):
        response = client.post("/api/games", json={"airlineName": "No HQ"})
        assert_error_envelope(response, 422, "validation_error")


class TestFullFlow:
    def test_buy_open_assign_end_turn(self, client):
        game_id = create_game(client)["id"]
        response = client.post(
            f"/api/games/{game_id}/commands",
            json={
                "commands": [
                    {"type": "buyAircraft", "modelId": "a320neo"},
                    {"type": "negotiateSlot", "cityId": "lax"},
                    {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
                    {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
                    {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7},
                ]
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert all(r["ok"] for r in body["results"])
        assert [r["index"] for r in body["results"]] == [0, 1, 2, 3, 4]
        state = body["state"]
        assert state["fleet"][0]["modelId"] == "a320neo"
        assert state["fleet"][0]["routeId"] == "rt-1"
        route = state["routes"][0]
        assert route["cityA"] == "nyc" and route["cityB"] == "lax"
        assert route["aircraftIds"] == ["ac-1"]
        assert route["weeklyFlights"] == 7
        assert route["lastQuarter"] is None

        response = client.post(f"/api/games/{game_id}/end-turn", json={})
        assert response.status_code == 200
        body = response.json()
        report, state = body["report"], body["state"]
        assert (report["turn"], report["year"], report["quarter"]) == (1, 2026, 3)
        stats = report["routeStats"][0]
        assert stats["routeId"] == "rt-1"
        assert 0 < stats["loadFactor"] <= 1
        assert stats["pax"] <= stats["capacity"]
        totals = report["totals"]
        assert totals["profit"] == pytest.approx(totals["revenue"] - totals["cost"])
        assert (state["turn"], state["quarter"]) == (2, 4)
        assert state["routes"][0]["lastQuarter"]["pax"] == stats["pax"]
        assert state["finance"]["lastQuarter"] == totals
        assert len(state["finance"]["history"]) == 1
        assert state["news"], "settlement should publish news"

    def test_partial_command_failure_reports_per_command(self, client):
        game_id = create_game(client)["id"]
        body = client.post(
            f"/api/games/{game_id}/commands",
            json={
                "commands": [
                    {"type": "openRoute", "cityA": "nyc", "cityB": "zzz"},  # zzz: not in cities.json
                    {"type": "negotiateSlot", "cityId": "lax"},
                    {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
                ]
            },
        ).json()
        assert [r["ok"] for r in body["results"]] == [False, True, True]
        assert "unknown city" in body["results"][0]["message"]
        assert len(body["state"]["routes"]) == 1


class TestCompetitorsWire:
    def test_competitors_and_market_share_serialize_camel_case(self, client):
        state = create_game(client, name="Wire Air", hq="hnd")
        assert state["marketShare"] == 0
        assert [c["id"] for c in state["competitors"]] == [
            "ai-aurora",
            "ai-meridian",
            "ai-falcon",
        ]
        aurora = state["competitors"][0]
        assert aurora["name"] == "Aurora Pacific"
        assert aurora["nameZh"] == "极光太平洋航空"
        assert aurora["hqCityId"] == "hnd"
        assert aurora["fareMult"] == 0.95
        assert aurora["marketShare"] == 0
        assert aurora["routes"][0] == {
            "cityA": "hnd",
            "cityB": "pvg",
            "weeklySeats": 1600,
        }

        body = client.post(f"/api/games/{state['id']}/end-turn", json={}).json()
        settled = body["state"]
        assert settled["marketShare"] == 0  # player flies no routes yet
        assert all(c["marketShare"] > 0 for c in settled["competitors"])
        # Evolution ran: Aurora's largest route grew 1600 → 1680.
        assert settled["competitors"][0]["routes"][0]["weeklySeats"] == 1680


class TestBankruptcyPath:
    def test_overleveraged_airline_goes_bankrupt(self, client):
        game_id = create_game(client, name="Icarus Air")["id"]
        # Burn the cash pile, then lease a fleet of 777-9s the books can't carry.
        commands = [{"type": "buyAircraft", "modelId": "a350-1000"}] + [
            {"type": "leaseAircraft", "modelId": "b777-9"}
        ] * 10
        body = client.post(
            f"/api/games/{game_id}/commands", json={"commands": commands}
        ).json()
        assert all(r["ok"] for r in body["results"])

        state = client.post(f"/api/games/{game_id}/end-turn", json={}).json()["state"]
        assert state["cash"] < 0
        assert state["status"] == "active"

        state = client.post(f"/api/games/{game_id}/end-turn", json={}).json()["state"]
        assert state["status"] == "bankrupt"

        # Bankrupt games refuse further commands and turns (CONTRACT §3).
        response = client.post(
            f"/api/games/{game_id}/commands",
            json={"commands": [{"type": "leaseAircraft", "modelId": "a320neo"}]},
        )
        assert_error_envelope(response, 400, "game_over")
        response = client.post(f"/api/games/{game_id}/end-turn", json={})
        assert_error_envelope(response, 400, "game_over")

        # The state remains fetchable for the post-mortem.
        assert client.get(f"/api/games/{game_id}").json()["status"] == "bankrupt"
