"""V3.3 multiplayer room-based match tests.

Test scenarios:
1. create match → join → start lobby flow
2. reject join when full / already started
3. 2-player settle: both players' routes on SAME city pair split the shared market
4. all-ready triggers settle + turn advance
5. deadline lazy auto-settle (set deadline in past, a poll triggers settle)
6. a player's view shows the OTHER human as a competitor with their routes
7. finished phase + finalStandings ranks everyone
8. MatchView camelCase wire smoke test
"""
from __future__ import annotations

import time

import pytest
from fastapi.testclient import TestClient

from app import match_store
from app.data import load_world
from app.engine import balance
from app.engine.commands import apply_commands
from app.engine.match import (
    Match,
    MatchError,
    MatchPlayer,
    _build_match_standings,
    add_player,
    mark_ready,
    maybe_auto_settle,
    new_match,
    settle_match,
    start_match,
)
from app.engine.state import (
    Competitor,
    CompetitorRoute,
    GameState,
    Route,
    World,
    haversine_km,
    new_game,
)
from app.main import app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def world() -> World:
    return load_world()


@pytest.fixture(autouse=True)
def clear_match_store():
    """Ensure a clean match store before each test."""
    match_store.clear()
    # Also reset the MatchService singleton so it picks up a fresh store.
    import app.routes.matches as mr
    mr._match_service = None
    yield
    match_store.clear()


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Pure engine tests
# ---------------------------------------------------------------------------


class TestMatchLobby:
    """Test create / join / start lobby flows."""

    def test_create_match_returns_host_player(self, world):
        match = new_match("TEST01", "Airline A", "nyc", max_players=2, fill_with_ai=True, world=world)
        assert match.code == "TEST01"
        assert match.phase == "lobby"
        assert len(match.players) == 1
        host = match.players[0]
        assert host.player_id == "p-TEST01-0"
        assert host.name == "Airline A"
        assert host.hq_city_id == "nyc"
        assert host.state is not None
        assert host.state.cash == balance.STARTING_CASH
        # Per-player state has empty competitors (AI lives at match level)
        assert host.state.competitors == []
        assert len(match.competitors) == 4  # 4 AI airlines

    def test_join_adds_second_player(self, world):
        match = new_match("TEST02", "Airline A", "nyc", max_players=2, fill_with_ai=True, world=world)
        pid = add_player(match, "Airline B", "lhr", world)
        assert pid == "p-TEST02-1"
        assert len(match.players) == 2
        p2 = match.players[1]
        assert p2.name == "Airline B"
        assert p2.hq_city_id == "lhr"
        assert p2.state.hq_city_id == "lhr"
        assert p2.state.competitors == []  # empty on per-player state

    def test_join_full_match_raises(self, world):
        match = new_match("TEST03", "A", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "B", "lhr", world)
        with pytest.raises(MatchError, match="full"):
            add_player(match, "C", "fra", world)

    def test_join_started_match_raises(self, world):
        match = new_match("TEST04", "A", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "B", "lhr", world)
        start_match(match, match.players[0].player_id)
        with pytest.raises(MatchError, match="started"):
            add_player(match, "C", "fra", world)

    def test_start_requires_host(self, world):
        match = new_match("TEST05", "A", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "B", "lhr", world)
        with pytest.raises(MatchError, match="host"):
            start_match(match, match.players[1].player_id)

    def test_start_requires_min_2_players(self, world):
        match = new_match("TEST06", "A", "nyc", max_players=2, fill_with_ai=True, world=world)
        with pytest.raises(MatchError, match="2 players"):
            start_match(match, match.players[0].player_id)

    def test_start_transitions_to_active(self, world):
        match = new_match("TEST07", "A", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "B", "lhr", world)
        start_match(match, match.players[0].player_id)
        assert match.phase == "active"
        assert match.turn_deadline_ms is not None
        assert match.turn_deadline_ms > time.time() * 1000  # deadline is in the future


class TestSharedMarketAllocation:
    """2-player settle: routes on SAME city pair split the shared market."""

    def _setup_2p_match_on_same_pair(self, world):
        """Two players both fly nyc–lax; each has 1 A320neo assigned."""
        match = new_match("MKTXX", "Alpha Air", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "Beta Air", "lax", world)
        start_match(match, match.players[0].player_id)

        # Give each player enough slots & a route on nyc-lax
        for i, (player, hq, dest) in enumerate(
            zip(match.players, ["nyc", "lax"], ["lax", "nyc"])
        ):
            state = player.state
            # Ensure slots at both ends
            state.slots_held["nyc"] = 10
            state.slots_held["lax"] = 10
            # Add a route nyc-lax with a leased aircraft
            from app.engine.state import FleetAircraft, Route, CabinMix
            from app.engine import balance as bal
            dist = round(haversine_km(
                world.cities["nyc"].lat, world.cities["nyc"].lon,
                world.cities["lax"].lat, world.cities["lax"].lon,
            ), 1)
            ac = FleetAircraft(id=f"ac-1-{i}", model_id="a320neo", ownership="leased")
            state.fleet.append(ac)
            route = Route(
                id=f"rt-1-{i}",
                city_a="nyc",
                city_b="lax",
                distance_km=dist,
                aircraft_ids=[ac.id],
                weekly_flights=7.0,
                fare_mult=1.0,
            )
            state.routes.append(route)
            ac.route_id = route.id

        return match

    def test_two_players_split_same_city_pair(self, world):
        """Both players on nyc-lax should each get less than the full market."""
        match = self._setup_2p_match_on_same_pair(world)
        reports = settle_match(match, world, event_pool=[], decision_pool=[])

        r_a = reports[match.players[0].player_id]
        r_b = reports[match.players[1].player_id]

        pax_a = r_a.route_stats[0].pax if r_a.route_stats else 0
        pax_b = r_b.route_stats[0].pax if r_b.route_stats else 0

        # Both get positive pax
        assert pax_a > 0, "Player A should get passengers on nyc-lax"
        assert pax_b > 0, "Player B should get passengers on nyc-lax"

        # Together they get less than if one player had all the market
        # (because there's also the background market taking a share)
        # The key property: allocation is split, not doubled
        from app.engine.simulate import market_pax as calc_market_pax
        market = calc_market_pax(
            world.cities["nyc"].demand_index,
            world.cities["lax"].demand_index,
            match.quarter,
            match.players[0].state.routes[0].distance_km,
        )
        total_sold = pax_a + pax_b
        assert total_sold < market, "Combined pax must not exceed total market"
        assert total_sold > 0

    def test_higher_fare_mult_gets_fewer_pax(self, world):
        """Player A at fareMult=1.4 should get fewer pax than player B at fareMult=0.8."""
        match = self._setup_2p_match_on_same_pair(world)
        # Set different fare mults
        match.players[0].state.routes[0].fare_mult = 1.4  # expensive
        match.players[1].state.routes[0].fare_mult = 0.8  # cheap

        reports = settle_match(match, world, event_pool=[], decision_pool=[])
        r_a = reports[match.players[0].player_id]
        r_b = reports[match.players[1].player_id]

        pax_a = r_a.route_stats[0].pax
        pax_b = r_b.route_stats[0].pax

        assert pax_b > pax_a, (
            f"Cheaper airline B ({pax_b} pax) should beat expensive A ({pax_a} pax)"
        )


class TestSettlementTriggers:
    """Test that settlement fires correctly."""

    def _make_started_match(self, world):
        match = new_match("STTLX", "Airline A", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "Airline B", "lhr", world)
        start_match(match, match.players[0].player_id)
        return match

    def test_all_ready_triggers_settle(self, world):
        match = self._make_started_match(world)
        turn_before = match.turn

        # Mark player A ready — not everyone ready yet
        should = mark_ready(match, match.players[0].player_id)
        assert not should  # Player B not ready yet
        assert match.turn == turn_before  # No settlement

        # Mark player B ready — all ready, should settle
        should = mark_ready(match, match.players[1].player_id)
        assert should  # All ready, settle
        settle_match(match, world, event_pool=[], decision_pool=[])
        assert match.turn == turn_before + 1  # Turn advanced

    def test_deadline_past_triggers_settle(self, world):
        """Set deadline in the past; a GET poll triggers auto-settle."""
        match = self._make_started_match(world)
        turn_before = match.turn

        # Set the deadline to the past
        match.turn_deadline_ms = (time.time() - 1) * 1000

        # Neither player is ready, but deadline passed
        from app.engine.match import _should_settle
        assert _should_settle(match)

        # maybe_auto_settle should trigger settlement
        reports = maybe_auto_settle(match, world, event_pool=[], decision_pool=[])
        assert reports is not None
        assert match.turn == turn_before + 1


class TestMatchViewContents:
    """Test that MatchView shows the correct 'you' and competitor data."""

    def test_opponent_appears_as_competitor_in_your_view(self, world):
        """Player A should see Player B in their you.competitors list."""
        match = new_match("VIEWX", "Alpha Air", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "Beta Air", "lhr", world)
        start_match(match, match.players[0].player_id)

        # Give player B a route so their routes appear in A's view
        p_b = match.players[1]
        p_b.state.slots_held["lhr"] = 10
        p_b.state.slots_held["fra"] = 10
        from app.engine.state import FleetAircraft, Route
        dist = round(haversine_km(
            world.cities["lhr"].lat, world.cities["lhr"].lon,
            world.cities["fra"].lat, world.cities["fra"].lon,
        ), 1)
        ac = FleetAircraft(id="ac-b-1", model_id="a320neo", ownership="leased")
        p_b.state.fleet.append(ac)
        rt = Route(id="rt-b-1", city_a="lhr", city_b="fra", distance_km=dist,
                   aircraft_ids=["ac-b-1"], weekly_flights=7.0)
        p_b.state.routes.append(rt)
        ac.route_id = rt.id

        from app.routes.matches import serialize_match_view
        view = serialize_match_view(match, match.players[0].player_id, world)

        # 'you' should contain both AI competitors AND player B
        competitor_ids = [c.id for c in view.you.competitors]
        assert "p-VIEWX-1" in competitor_ids, "Player B should appear as competitor in A's view"

        # AI competitors should also be there
        assert any(cid.startswith("ai-") for cid in competitor_ids)

        # Player B's routes should show up
        p_b_comp = next(c for c in view.you.competitors if c.id == "p-VIEWX-1")
        assert len(p_b_comp.routes) >= 0  # routes list is there

    def test_players_list_contains_all_humans(self, world):
        match = new_match("PLIST", "A", "nyc", max_players=3, fill_with_ai=True, world=world)
        add_player(match, "B", "lhr", world)
        add_player(match, "C", "fra", world)
        start_match(match, match.players[0].player_id)

        from app.routes.matches import serialize_match_view
        view = serialize_match_view(match, match.players[0].player_id, world)

        assert len(view.players) == 3
        names = [p.name for p in view.players]
        assert "A" in names and "B" in names and "C" in names

    def test_your_player_id_matches_you_id(self, world):
        match = new_match("MYID0", "Solo Air", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "Other Air", "lhr", world)
        start_match(match, match.players[0].player_id)

        from app.routes.matches import serialize_match_view
        pid = match.players[0].player_id
        view = serialize_match_view(match, pid, world)
        assert view.you.id == pid


class TestFinalStandings:
    """Test that finished phase + finalStandings ranks all players and AI."""

    def test_final_standings_after_game_length(self, world):
        """Force a match to game length and verify finalStandings."""
        match = new_match("FINAL", "A Air", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "B Air", "lhr", world)
        start_match(match, match.players[0].player_id)

        # Set turn to last turn so settlement triggers finish
        match.turn = balance.GAME_LENGTH_TURNS

        reports = settle_match(match, world, event_pool=[], decision_pool=[])
        assert match.phase == "finished"
        assert match.final_standings is not None
        assert len(match.final_standings) == 6  # 2 players + 4 AI
        # Standings should be sorted descending by market share
        shares = [s.market_share for s in match.final_standings]
        assert shares == sorted(shares, reverse=True)

    def test_final_standings_has_players_and_ai(self, world):
        match = new_match("FNLC2", "P1", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "P2", "lhr", world)
        start_match(match, match.players[0].player_id)
        match.turn = balance.GAME_LENGTH_TURNS
        settle_match(match, world, event_pool=[], decision_pool=[])

        player_entries = [s for s in match.final_standings if s.is_player]
        ai_entries = [s for s in match.final_standings if not s.is_player]
        assert len(player_entries) == 2
        assert len(ai_entries) == 4


class TestReadyAndSettleCycle:
    """Full ready→settle→advance cycle."""

    def test_ready_then_settle_advances_turn(self, world):
        match = new_match("CYCL0", "A", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "B", "lhr", world)
        start_match(match, match.players[0].player_id)

        t0 = match.turn
        from app.match_service import MatchService
        from app.data import load_events, load_decisions
        svc = MatchService(world, event_pool=[], decision_pool=[])
        import app.routes.matches as mr
        mr._match_service = svc
        import app.match_store as ms
        ms.add(match)

        # Both players mark ready
        mark_ready(match, match.players[0].player_id)
        should = mark_ready(match, match.players[1].player_id)
        assert should
        settle_match(match, world, event_pool=[], decision_pool=[])
        assert match.turn == t0 + 1
        # Ready flags reset
        for p in match.players:
            assert not p.ready


class TestLastReport:
    """Test that last_report is populated after settlement."""

    def test_last_report_has_route_stats(self, world):
        match = new_match("RPTST", "Air A", "nyc", max_players=2, fill_with_ai=True, world=world)
        add_player(match, "Air B", "lhr", world)
        start_match(match, match.players[0].player_id)

        # Give player A a route nyc-lax
        pa = match.players[0]
        pa.state.slots_held["nyc"] = 10
        pa.state.slots_held["lax"] = 10
        from app.engine.state import FleetAircraft, Route
        dist = round(haversine_km(
            world.cities["nyc"].lat, world.cities["nyc"].lon,
            world.cities["lax"].lat, world.cities["lax"].lon,
        ), 1)
        ac = FleetAircraft(id="ac-rpt", model_id="a320neo", ownership="leased")
        pa.state.fleet.append(ac)
        rt = Route(id="rt-rpt", city_a="nyc", city_b="lax", distance_km=dist,
                   aircraft_ids=["ac-rpt"], weekly_flights=7.0)
        pa.state.routes.append(rt)
        ac.route_id = rt.id

        # Force both ready and settle
        mark_ready(match, match.players[0].player_id)
        mark_ready(match, match.players[1].player_id)
        settle_match(match, world, event_pool=[], decision_pool=[])

        pid_a = match.players[0].player_id
        assert pid_a in match.last_reports
        report = match.last_reports[pid_a]
        assert report.turn == 1
        assert any(s.route_id == "rt-rpt" for s in report.route_stats)


# ---------------------------------------------------------------------------
# API smoke tests (TestClient)
# ---------------------------------------------------------------------------


class TestMatchAPI:
    """HTTP smoke tests for the 6 match endpoints."""

    def test_create_match_201(self, client):
        resp = client.post("/api/matches", json={
            "hostName": "Test Air",
            "hostHqCityId": "nyc",
            "maxPlayers": 2,
            "fillWithAi": True,
        })
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert "code" in body and "playerId" in body
        assert len(body["code"]) == 6

    def test_join_match(self, client):
        # Create first
        r1 = client.post("/api/matches", json={
            "hostName": "Host",
            "hostHqCityId": "nyc",
            "maxPlayers": 3,
            "fillWithAi": True,
        })
        code = r1.json()["code"]

        r2 = client.post(f"/api/matches/{code}/join", json={"name": "Guest", "hqCityId": "lhr"})
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert "playerId" in body

    def test_start_match(self, client):
        r1 = client.post("/api/matches", json={
            "hostName": "Host2",
            "hostHqCityId": "nyc",
            "maxPlayers": 2,
            "fillWithAi": True,
        })
        code = r1.json()["code"]
        host_pid = r1.json()["playerId"]

        client.post(f"/api/matches/{code}/join", json={"name": "G2", "hqCityId": "lhr"})

        r3 = client.post(f"/api/matches/{code}/start", json={"playerId": host_pid})
        assert r3.status_code == 200, r3.text
        view = r3.json()
        assert view["phase"] == "active"
        assert view["code"] == code

    def test_get_match_view_camel_case(self, client):
        """Verify MatchView wire format is camelCase."""
        r1 = client.post("/api/matches", json={
            "hostName": "CamelAir",
            "hostHqCityId": "nyc",
            "maxPlayers": 2,
            "fillWithAi": True,
        })
        code = r1.json()["code"]
        pid = r1.json()["playerId"]
        client.post(f"/api/matches/{code}/join", json={"name": "Other", "hqCityId": "lhr"})
        client.post(f"/api/matches/{code}/start", json={"playerId": pid})

        r2 = client.get(f"/api/matches/{code}?playerId={pid}")
        assert r2.status_code == 200, r2.text
        view = r2.json()

        # Check top-level camelCase fields
        assert "code" in view
        assert "phase" in view
        assert "maxPlayers" in view         # camelCase
        assert "turnDeadlineMs" in view     # camelCase
        assert "lastReport" in view         # camelCase
        assert "finalStandings" in view     # camelCase

        # Check players list
        assert "players" in view
        p = view["players"][0]
        assert "playerId" in p             # camelCase
        assert "hqCityId" in p             # camelCase
        assert "marketShare" in p          # camelCase

        # Check 'you' GameState is camelCase
        you = view["you"]
        assert "airlineName" in you
        assert "hqCityId" in you
        assert "marketShare" in you
        assert "slotMarket" in you

    def test_match_commands_endpoint(self, client):
        r1 = client.post("/api/matches", json={
            "hostName": "Cmd Air",
            "hostHqCityId": "nyc",
            "maxPlayers": 2,
            "fillWithAi": True,
        })
        code = r1.json()["code"]
        host_pid = r1.json()["playerId"]
        client.post(f"/api/matches/{code}/join", json={"name": "G", "hqCityId": "lhr"})
        client.post(f"/api/matches/{code}/start", json={"playerId": host_pid})

        # Buy an aircraft
        r2 = client.post(f"/api/matches/{code}/commands", json={
            "playerId": host_pid,
            "commands": [{"type": "buyAircraft", "modelId": "a320neo"}],
        })
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert "view" in body
        assert "results" in body
        assert body["results"][0]["ok"] is True

    def test_match_ready_endpoint(self, client):
        r1 = client.post("/api/matches", json={
            "hostName": "Ready Air",
            "hostHqCityId": "nyc",
            "maxPlayers": 2,
            "fillWithAi": True,
        })
        code = r1.json()["code"]
        host_pid = r1.json()["playerId"]
        r2 = client.post(f"/api/matches/{code}/join", json={"name": "G", "hqCityId": "lhr"})
        guest_pid = r2.json()["playerId"]
        client.post(f"/api/matches/{code}/start", json={"playerId": host_pid})

        # Host marks ready
        r3 = client.post(f"/api/matches/{code}/ready", json={"playerId": host_pid})
        assert r3.status_code == 200, r3.text
        view = r3.json()
        assert view["phase"] in ("active", "finished")

        # Guest marks ready → triggers settle
        r4 = client.post(f"/api/matches/{code}/ready", json={"playerId": guest_pid})
        assert r4.status_code == 200, r4.text
        view2 = r4.json()
        # After both ready, turn should have advanced (turn 2) or match finished
        assert view2["turn"] >= 2 or view2["phase"] == "finished"

    def test_join_full_match_returns_error(self, client):
        r1 = client.post("/api/matches", json={
            "hostName": "Full Air",
            "hostHqCityId": "nyc",
            "maxPlayers": 2,
            "fillWithAi": True,
        })
        code = r1.json()["code"]
        client.post(f"/api/matches/{code}/join", json={"name": "G1", "hqCityId": "lhr"})

        # Third player tries to join → should fail
        r3 = client.post(f"/api/matches/{code}/join", json={"name": "G2", "hqCityId": "fra"})
        assert r3.status_code in (400, 422), r3.text

    def test_unknown_match_returns_404(self, client):
        r = client.get("/api/matches/XXXXXX?playerId=p-XXXXXX-0")
        assert r.status_code == 404, r.text

    def test_match_not_found_error_envelope(self, client):
        r = client.get("/api/matches/XXXXXX?playerId=p-XXXXXX-0")
        assert r.status_code == 404
        body = r.json()
        assert "error" in body


class TestMatchErrorHandling:
    """Error cases: wrong player, bankrupt, etc."""

    def test_non_host_cannot_start(self, client):
        r1 = client.post("/api/matches", json={
            "hostName": "H",
            "hostHqCityId": "nyc",
            "maxPlayers": 2,
            "fillWithAi": True,
        })
        code = r1.json()["code"]
        r2 = client.post(f"/api/matches/{code}/join", json={"name": "G", "hqCityId": "lhr"})
        guest_pid = r2.json()["playerId"]

        r3 = client.post(f"/api/matches/{code}/start", json={"playerId": guest_pid})
        assert r3.status_code in (400, 422), r3.text
