"""M2.1 AI rival airlines (CONTRACT §3): seeding, share competition, capacity
redistribution, per-turn evolution and determinism."""
from __future__ import annotations

import math

from app.engine import balance
from app.engine.simulate import market_pax, settle_turn
from app.engine.state import Competitor, CompetitorRoute, new_game

from tests.conftest import run


def fresh(world, game_id="g-ai", hq="hnd", name="Pacific Test Air"):
    """A game headquartered in Tokyo so the player can contest Aurora Pacific's
    hnd city pairs (the four balance scenarios stay on uncontested NYC pairs)."""
    return new_game(game_id, name, world.cities[hq])


def fly_hnd_pvg(game, world, fare_mult=1.0):
    """1 owned A320neo on hnd–pvg, 7 weekly flights per direction."""
    run(
        game,
        world,
        {"type": "buyAircraft", "modelId": "a320neo"},
        {"type": "negotiateSlot", "cityId": "pvg"},  # M2.2: hold a pvg slot
        {"type": "openRoute", "cityA": "hnd", "cityB": "pvg"},
        {"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"},
        {"type": "updateRoute", "routeId": "rt-1", "weeklyFlights": 7, "fareMult": fare_mult},
    )


class TestSeeding:
    def test_new_game_seeds_the_four_fixed_ais(self, world):
        game = fresh(world)
        assert [c.id for c in game.competitors] == [
            "ai-aurora",
            "ai-meridian",
            "ai-falcon",
            "ai-vector",
        ]
        aurora, meridian, falcon, vector = game.competitors
        assert (aurora.name_zh, aurora.hq_city_id, aurora.fare_mult, aurora.style) == (
            "极光太平洋航空",
            "hnd",
            0.95,
            "budget",
        )
        assert (meridian.hq_city_id, meridian.fare_mult, meridian.style) == ("lhr", 1.1, "premium")
        assert (falcon.hq_city_id, falcon.fare_mult, falcon.style) == ("dxb", 1.0, "network")
        assert (vector.hq_city_id, vector.fare_mult, vector.style) == ("icn", 1.0, "aggressive")
        assert [(r.city_a, r.city_b, r.weekly_seats) for r in aurora.routes] == [
            ("hnd", "pvg", 1600),
            ("hnd", "sin", 1600),
        ]
        assert [(r.city_a, r.city_b) for r in meridian.routes] == [
            ("lhr", "fra"),
            ("lhr", "dxb"),
        ]
        assert [(r.city_a, r.city_b) for r in falcon.routes] == [
            ("dxb", "sin"),
            ("dxb", "cdg"),
        ]
        assert [(r.city_a, r.city_b, r.weekly_seats) for r in vector.routes] == [
            ("icn", "pvg", 1600),
            ("icn", "bkk", 1600),
        ]
        assert game.market_share == 0.0
        assert all(c.market_share == 0.0 for c in game.competitors)


class TestShareCompetition:
    def test_ai_competition_reduces_player_pax(self, world):
        contested = fresh(world, game_id="g-contested")
        fly_hnd_pvg(contested, world)
        solo = fresh(world, game_id="g-solo")
        solo.competitors = []
        fly_hnd_pvg(solo, world)

        contested_stats = settle_turn(contested, world).route_stats[0]
        solo_stats = settle_turn(solo, world).route_stats[0]
        # The solo plane is not capacity-capped, so this is a real comparison.
        assert solo_stats.load_factor < 1.0
        assert contested_stats.pax < solo_stats.pax

    def test_lower_fare_ai_takes_bigger_slice_at_equal_capacity(self, world):
        # Use style="network" (no fare override logic) so that fare_mult is the
        # only differentiator and the test verifies pure price elasticity.
        game = fresh(world, game_id="g-fare")
        game.competitors = [
            Competitor(
                id="ai-cheap", name="Cheap Air", name_zh="低价航空",
                hq_city_id="hnd", fare_mult=0.9, style="network",
                routes=[CompetitorRoute("hnd", "pvg", 1600)],
            ),
            Competitor(
                id="ai-posh", name="Posh Air", name_zh="高端航空",
                hq_city_id="hnd", fare_mult=1.1, style="network",
                routes=[CompetitorRoute("hnd", "pvg", 1600)],
            ),
        ]
        settle_turn(game, world)
        cheap, posh = game.competitors
        assert cheap.market_share > posh.market_share > 0

    def test_capped_ai_spills_unmet_demand_to_other_sellers(self, world):
        """A tiny-capacity AI must not waste the market: its unmet demand is
        redistributed (one pass) to the non-capped sellers, incl. the player."""
        game = fresh(world, game_id="g-spill")
        fly_hnd_pvg(game, world)
        game.competitors = [
            Competitor(
                id="ai-tiny", name="Tiny Air", name_zh="迷你航空",
                hq_city_id="hnd", fare_mult=0.9, style="network",
                routes=[CompetitorRoute("hnd", "pvg", 10)],
            ),
        ]
        route = game.routes[0]
        stats = settle_turn(game, world).route_stats[0]

        hnd, pvg = world.cities["hnd"], world.cities["pvg"]
        market = market_pax(hnd.demand_index, pvg.demand_index, 3, route.distance_km)
        w_player = 1.0
        w_ai = 0.9 ** balance.PRICE_ELASTICITY
        total_weight = w_player + w_ai + balance.W_BG
        first_pass = market * w_player * (w_player / total_weight)
        assert stats.pax > round(first_pass)  # spillover reached the player...
        assert stats.pax < stats.capacity  # ...and is not just a capacity fill

    def test_market_share_uses_one_yardstick_for_player_and_ais(self, world):
        game = fresh(world, game_id="g-share")
        fly_hnd_pvg(game, world)
        settle_turn(game, world)
        shares = [game.market_share] + [c.market_share for c in game.competitors]
        assert all(0 < share < 1 for share in shares)
        assert sum(shares) < 1  # the background market holds the rest

    def test_player_with_no_routes_has_zero_share(self, world):
        game = fresh(world, game_id="g-zero")
        settle_turn(game, world)
        assert game.market_share == 0.0
        assert all(c.market_share > 0 for c in game.competitors)


class TestEvolution:
    def test_largest_route_grows_every_turn(self, world):
        game = fresh(world, game_id="g-grow")
        aurora = game.competitors[0]
        # aurora (budget style) uses default growth factor 1.05
        settle_turn(game, world)
        # 1600 × 1.05 = 1680 (exact); only the largest route grows.
        assert [r.weekly_seats for r in aurora.routes] == [1680, 1600]
        settle_turn(game, world)
        # ceil(1680 × 1.05) = 1764 (exact).
        assert [r.weekly_seats for r in aurora.routes] == [1764, 1600]
        assert aurora.routes[0].weekly_seats == math.ceil(round(1680 * 1.05, 6))

    def test_aggressive_ai_opens_on_turn_4(self, world):
        """Vector Sky (aggressive) opens every 4 turns (not 6)."""
        from app.engine import balance as bal
        game = fresh(world, game_id="g-aggressive")
        vector = game.competitors[3]  # ai-vector
        assert vector.style == "aggressive"
        # After 3 turns no new routes for Vector.
        for _ in range(3):
            settle_turn(game, world)
        assert len(vector.routes) == 2
        # Turn 4: aggressive cadence fires.
        report = settle_turn(game, world)
        assert len(vector.routes) == 3
        openings = [item for item in report.news if "开通" in item.headline and "矢量天空" in item.headline]
        assert len(openings) == 1

    def test_new_hq_route_opens_on_cadence_turn_with_news(self, world):
        """At turn 6 the non-aggressive AIs (aurora/meridian/falcon) open new routes.
        Vector Sky (aggressive, cadence 4) already opened at turn 4."""
        game = fresh(world, game_id="g-open")
        # Turns 1–3: no openings for aurora/meridian/falcon; Vector has 2 routes still.
        for t in range(1, 4):
            report = settle_turn(game, world)
            aurora, meridian, falcon, vector = game.competitors
            assert len(aurora.routes) == 2
            assert len(meridian.routes) == 2
            assert len(falcon.routes) == 2
            # No opening news for the 3 standard-cadence AIs
            base_openings = [
                item for item in report.news
                if "开通" in item.headline and "矢量天空" not in item.headline
            ]
            assert len(base_openings) == 0

        # Turn 4: Vector (aggressive) opens a route; others still 2 routes.
        report4 = settle_turn(game, world)
        aurora, meridian, falcon, vector = game.competitors
        assert len(vector.routes) == 3
        assert len(aurora.routes) == 2
        assert len(meridian.routes) == 2
        assert len(falcon.routes) == 2

        # Turn 5: no new openings.
        report5 = settle_turn(game, world)
        aurora, meridian, falcon, vector = game.competitors
        assert len(aurora.routes) == 2
        assert len(meridian.routes) == 2
        assert len(falcon.routes) == 2

        # Turn 6: aurora/meridian/falcon open new routes (cadence 6).
        report6 = settle_turn(game, world)
        aurora, meridian, falcon, vector = game.competitors
        assert len(aurora.routes) == 3
        assert len(meridian.routes) == 3
        assert len(falcon.routes) == 3

        new_route = aurora.routes[-1]
        # nyc is the highest-demandIndex city Aurora doesn't serve yet.
        assert (new_route.city_a, new_route.city_b) == ("hnd", "nyc")
        assert new_route.weekly_seats == balance.AI_NEW_ROUTE_WEEKLY_SEATS == 2000

        openings = [item for item in report6.news if "开通" in item.headline]
        assert len(openings) == 3  # aurora + meridian + falcon on turn 6
        assert all(item.kind == "system" for item in openings)
        assert any(
            item.headline == "极光太平洋航空 开通 东京 — 纽约 航线"
            for item in openings
        )
        assert any("开通" in item.headline for item in game.news)


class TestDeterminism:
    def test_identical_games_evolve_identically_over_five_turns(self, world):
        game_a = fresh(world, game_id="g-det-a")
        game_b = fresh(world, game_id="g-det-b")
        fly_hnd_pvg(game_a, world)
        fly_hnd_pvg(game_b, world)
        for _ in range(5):
            settle_turn(game_a, world)
            settle_turn(game_b, world)
        assert game_a.competitors == game_b.competitors
        assert game_a.market_share == game_b.market_share
        assert game_a.routes[0].last_quarter == game_b.routes[0].last_quarter
