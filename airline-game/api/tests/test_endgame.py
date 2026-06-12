"""M2.4 endgame tests: lifetime accumulation, turn-80 finish, standings ranking,
tie-break determinism, rejection of commands/end-turn after finish, and camelCase
serialization of the new fields.

All numbers are hand-recomputable or use unit-tested pure functions directly.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.engine import balance
from app.engine.simulate import _build_final_result, settle_turn
from app.engine.state import (
    Competitor,
    FinalResult,
    GameState,
    Lifetime,
    StandingEntry,
    World,
    new_game,
    GameOverError,
    ensure_active,
)
from app.engine.commands import apply_commands
from app.main import app

from tests.conftest import run


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _setup_with_route(game: GameState, world: World) -> None:
    """Set up a single A320neo on NYc–LAX so settlements produce non-zero pax."""
    run(
        game,
        world,
        {"type": "buyAircraft", "modelId": "a320neo"},
        {"type": "negotiateSlot", "cityId": "lax"},
        {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
        {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
        {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7},
    )


def _fast_forward(game: GameState, world: World, n_turns: int) -> None:
    """Run n_turns settlements in-process (fast-forward helper)."""
    for _ in range(n_turns):
        settle_turn(game, world)


# ---------------------------------------------------------------------------
# Lifetime accumulation
# ---------------------------------------------------------------------------


class TestLifetimeAccumulation:
    """Verify lifetime.profit and lifetime.pax over 3 hand-recomputable turns."""

    def test_lifetime_zero_on_new_game(self, game, world):
        assert game.lifetime.profit == 0.0
        assert game.lifetime.pax == 0

    def test_lifetime_accumulates_over_three_turns(self, game, world):
        """
        Settle 3 turns with a route, then verify accumulated values match the
        sum of each turn's profit and route pax by reading them from reports.
        """
        _setup_with_route(game, world)

        profits: list[float] = []
        route_paxes: list[int] = []
        for _ in range(3):
            report = settle_turn(game, world)
            profits.append(report.totals.profit)
            route_paxes.append(
                sum(rs.pax for rs in report.route_stats)
            )

        expected_profit = round(sum(profits), 2)
        expected_pax = sum(route_paxes)

        assert game.lifetime.profit == pytest.approx(expected_profit, abs=0.01)
        assert game.lifetime.pax == expected_pax

    def test_lifetime_includes_loss_turns(self, game, world):
        """A costly fleet with no revenue still accumulates negative profit."""
        # Lease 15 wide-bodies — holding cost alone will guarantee negative profit.
        for _ in range(15):
            run(game, world, {"type": "leaseAircraft", "modelId": "b777-9"})

        report = settle_turn(game, world)
        assert report.totals.profit < 0  # confirm the turn is a loss
        # lifetime.profit should equal that negative profit
        assert game.lifetime.profit == pytest.approx(report.totals.profit, abs=0.01)
        assert game.lifetime.pax == 0  # no route → no pax

    def test_lifetime_pax_is_actual_flown(self, game, world):
        """lifetime.pax counts only pax actually flown, not capacity."""
        _setup_with_route(game, world)
        report = settle_turn(game, world)
        route_pax = report.route_stats[0].pax
        # Should be well below capacity; confirm it equals lifetime.pax
        assert game.lifetime.pax == route_pax
        assert game.lifetime.pax > 0


# ---------------------------------------------------------------------------
# Turn-80 finish (fast-forward)
# ---------------------------------------------------------------------------


class TestTurn80Finish:
    def test_game_finishes_at_turn_80(self, game, world):
        assert balance.GAME_LENGTH_TURNS == 80  # ensure constant is set
        _setup_with_route(game, world)
        _fast_forward(game, world, 80)
        assert game.status == "finished"

    def test_final_result_is_set_after_turn_80(self, game, world):
        _setup_with_route(game, world)
        _fast_forward(game, world, 80)
        assert game.final_result is not None
        assert isinstance(game.final_result, FinalResult)

    def test_final_result_not_set_before_turn_80(self, game, world):
        _setup_with_route(game, world)
        _fast_forward(game, world, 79)
        assert game.status == "active"
        assert game.final_result is None

    def test_ended_turn_equals_game_length(self, game, world):
        _fast_forward(game, world, 80)
        assert game.final_result is not None
        assert game.final_result.ended_turn == balance.GAME_LENGTH_TURNS

    def test_standings_has_four_entries(self, game, world):
        _fast_forward(game, world, 80)
        assert len(game.final_result.standings) == 4  # 1 player + 3 AI

    def test_standings_ordered_by_market_share_desc(self, game, world):
        _setup_with_route(game, world)
        _fast_forward(game, world, 80)
        fr = game.final_result
        shares = [s.market_share for s in fr.standings]
        assert shares == sorted(shares, reverse=True)

    def test_cumulative_stats_match_lifetime(self, game, world):
        _setup_with_route(game, world)
        _fast_forward(game, world, 80)
        fr = game.final_result
        assert fr.cumulative_profit == pytest.approx(game.lifetime.profit, abs=0.01)
        assert fr.cumulative_pax == game.lifetime.pax

    def test_victory_flag_consistent_with_rank(self, game, world):
        _fast_forward(game, world, 80)
        fr = game.final_result
        assert fr.victory == (fr.rank == 1)

    def test_rank_is_between_1_and_4(self, game, world):
        _fast_forward(game, world, 80)
        assert 1 <= game.final_result.rank <= 4

    def test_turn_advances_past_80_to_81(self, game, world):
        """Calendar still advances after the last settle (state.turn = 81)."""
        _fast_forward(game, world, 80)
        assert game.turn == 81


# ---------------------------------------------------------------------------
# Ranking logic (unit tests on _build_final_result / StandingEntry sorting)
# ---------------------------------------------------------------------------


def _make_state_with_shares(
    player_share: float,
    ai_shares: list[float],
) -> GameState:
    """Build a minimal GameState with custom marketShare values for ranking tests."""
    from app.engine.competitors import initial_competitors

    state = GameState(
        id="rank-test",
        airline_name="Test Air",
        hq_city_id="nyc",
        turn=80,
        year=2046,
        quarter=2,
        cash=0.0,
        competitors=initial_competitors(),
        market_share=player_share,
    )
    for competitor, share in zip(state.competitors, ai_shares):
        competitor.market_share = share
    return state


class TestRankingLogic:
    def test_player_wins_when_highest_share(self):
        state = _make_state_with_shares(0.5, [0.2, 0.1, 0.05])
        fr = _build_final_result(state)
        assert fr.rank == 1
        assert fr.victory is True
        assert fr.standings[0].is_player is True
        assert fr.standings[0].name == "Test Air"

    def test_player_loses_when_all_ais_higher(self):
        state = _make_state_with_shares(0.05, [0.4, 0.3, 0.2])
        fr = _build_final_result(state)
        assert fr.rank == 4
        assert fr.victory is False
        assert fr.standings[3].is_player is True

    def test_player_ranked_correctly_in_middle(self):
        # AI-0 > player > AI-1 > AI-2
        state = _make_state_with_shares(0.3, [0.4, 0.2, 0.1])
        fr = _build_final_result(state)
        assert fr.rank == 2
        assert fr.standings[1].is_player is True

    def test_tie_player_beats_all_ais(self):
        """With an equal share, the player ranks above every AI."""
        share = 0.25
        state = _make_state_with_shares(share, [share, share, share])
        fr = _build_final_result(state)
        assert fr.rank == 1
        assert fr.standings[0].is_player is True

    def test_tie_between_ais_respects_roster_order(self):
        """Among AIs with equal share, aurora (index 0) beats meridian (1) beats
        falcon (2) per CONTRACT §3 M2.4 deterministic roster order."""
        # Player clearly last; all 3 AIs are tied.
        share = 0.25
        state = _make_state_with_shares(0.0, [share, share, share])
        fr = _build_final_result(state)
        # Standings positions 0-2 are the three AIs in roster order
        ai_standings = [s for s in fr.standings if not s.is_player]
        ai_names = [s.name for s in ai_standings]
        expected_names = [c.name for c in state.competitors]
        assert ai_names == expected_names

    def test_partial_tie_player_first_then_ai_roster(self):
        """Player and AI-0 tie for first; player wins that tie."""
        share = 0.3
        state = _make_state_with_shares(share, [share, 0.2, 0.1])
        fr = _build_final_result(state)
        assert fr.standings[0].is_player is True
        assert fr.standings[1].is_player is False
        # The second entry should be aurora (AI index 0)
        assert fr.standings[1].name == state.competitors[0].name

    def test_standings_market_shares_are_correct(self):
        """Each StandingEntry carries the correct marketShare value."""
        state = _make_state_with_shares(0.3, [0.4, 0.2, 0.1])
        fr = _build_final_result(state)
        # All four marketShare values should appear in the standings
        all_shares = sorted([s.market_share for s in fr.standings], reverse=True)
        assert all_shares == [0.4, 0.3, 0.2, 0.1]


# ---------------------------------------------------------------------------
# Commands and end-turn rejected after finish
# ---------------------------------------------------------------------------


class TestFinishedGameRejection:
    def test_end_turn_rejected_on_finished_game(self, game, world):
        _fast_forward(game, world, 80)
        assert game.status == "finished"
        with pytest.raises(GameOverError, match="比赛已结束"):
            settle_turn(game, world)

    def test_commands_rejected_on_finished_game(self, game, world):
        _fast_forward(game, world, 80)
        with pytest.raises(GameOverError, match="比赛已结束"):
            apply_commands(
                game, world, [{"type": "leaseAircraft", "modelId": "a320neo"}]
            )

    def test_finished_message_distinct_from_bankrupt(self, game, world):
        """Bankrupt message does NOT contain '比赛已结束'."""
        # Burn all cash via aircraft purchases so the holding costs guarantee
        # negative cash every quarter.  Buy a350-1000 (~$366M) first to spend
        # the bulk of $420M starting cash, then pile on leases.
        run(game, world, {"type": "buyAircraft", "modelId": "a350-1000"})
        for _ in range(30):
            run(game, world, {"type": "leaseAircraft", "modelId": "b777-9"})
        # Two settlements should push to bankruptcy (both should end with cash < 0).
        report1 = settle_turn(game, world)
        assert report1.totals.profit < 0, "expected negative profit in turn 1"
        assert game.cash < 0, "expected negative cash after turn 1"
        settle_turn(game, world)
        assert game.status == "bankrupt"
        with pytest.raises(GameOverError) as exc_info:
            settle_turn(game, world)
        assert "比赛已结束" not in str(exc_info.value)
        assert "bankrupt" in str(exc_info.value)

    def test_ensure_active_raises_for_finished(self, game, world):
        _fast_forward(game, world, 80)
        with pytest.raises(GameOverError, match="比赛已结束"):
            ensure_active(game)


# ---------------------------------------------------------------------------
# API / camelCase wire serialization smoke tests
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


def create_game(client, name="Endgame Air", hq="nyc") -> dict:
    r = client.post("/api/games", json={"airlineName": name, "hqCityId": hq})
    assert r.status_code == 201
    return r.json()


class TestCamelCaseWire:
    def test_lifetime_and_final_result_present_on_new_game(self, client):
        state = create_game(client)
        assert "lifetime" in state
        assert state["lifetime"] == {"profit": 0.0, "pax": 0}
        assert "finalResult" in state
        assert state["finalResult"] is None

    def test_lifetime_accumulates_on_wire(self, client):
        game_id = create_game(client)["id"]
        # Buy and set up a route so profit is non-trivial.
        client.post(
            f"/api/games/{game_id}/commands",
            json={
                "commands": [
                    {"type": "buyAircraft", "modelId": "a320neo"},
                    {"type": "negotiateSlot", "cityId": "lax"},
                    {"type": "openRoute", "cityA": "nyc", "cityB": "lax"},
                    {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
                ]
            },
        )
        body = client.post(f"/api/games/{game_id}/end-turn", json={}).json()
        state = body["state"]
        assert state["lifetime"]["pax"] >= 0
        # profit can be negative (holding + overhead); just confirm it's a number
        assert isinstance(state["lifetime"]["profit"], (int, float))

    def test_finished_game_returns_final_result_via_api(self, client):
        """Fast-forward a game to turn 80 via the API; finalResult must appear."""
        game_id = create_game(client, name="Fast Finish Air")["id"]
        state = None
        for _ in range(80):
            r = client.post(f"/api/games/{game_id}/end-turn", json={})
            assert r.status_code == 200, f"end-turn failed at turn: {r.json()}"
            state = r.json()["state"]

        assert state["status"] == "finished"
        fr = state["finalResult"]
        assert fr is not None
        assert "rank" in fr
        assert "victory" in fr
        assert "standings" in fr
        assert "cumulativeProfit" in fr
        assert "cumulativePax" in fr
        assert "endedTurn" in fr
        assert fr["endedTurn"] == 80
        # standings camelCase
        assert len(fr["standings"]) == 4
        first_standing = fr["standings"][0]
        assert "name" in first_standing
        assert "isPlayer" in first_standing
        assert "marketShare" in first_standing

    def test_commands_rejected_on_finished_game_via_api(self, client):
        game_id = create_game(client, name="Reject After Finish")["id"]
        for _ in range(80):
            client.post(f"/api/games/{game_id}/end-turn", json={})

        r = client.post(
            f"/api/games/{game_id}/commands",
            json={"commands": [{"type": "leaseAircraft", "modelId": "a320neo"}]},
        )
        assert r.status_code == 400
        body = r.json()
        assert body["error"]["type"] == "game_over"
        assert "比赛已结束" in body["error"]["message"]

    def test_end_turn_rejected_on_finished_game_via_api(self, client):
        game_id = create_game(client, name="No More Turns")["id"]
        for _ in range(80):
            client.post(f"/api/games/{game_id}/end-turn", json={})

        r = client.post(f"/api/games/{game_id}/end-turn", json={})
        assert r.status_code == 400
        body = r.json()
        assert body["error"]["type"] == "game_over"
        assert "比赛已结束" in body["error"]["message"]

    def test_finished_status_persists_on_get(self, client):
        game_id = create_game(client, name="Persist Finish")["id"]
        for _ in range(80):
            client.post(f"/api/games/{game_id}/end-turn", json={})

        state = client.get(f"/api/games/{game_id}").json()
        assert state["status"] == "finished"
        assert state["finalResult"] is not None
