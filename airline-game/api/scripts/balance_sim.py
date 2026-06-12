"""M5.3 Balance Simulator — fast-forward engine without HTTP.

Runs N games per strategy × HQ combination for --turns turns each and prints
a compact summary table.  Events are disabled for full determinism; no network
I/O is performed.

Usage:
    python scripts/balance_sim.py [--turns 80] [--games 5]

Strategies
----------
narrowbody-hub   Lease 3 A320neo, open 3 short/medium routes from HQ.
widebody-premium Buy 2 787-9, 1 long-haul route, premium fare.
budget           Lease 3 A320neo, 3 routes, discount fares (0.8).
idle             No commands — pure overhead drain.

HQ choices: nyc, hnd, lhr
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import Callable

# Ensure the api root is on the path when invoked as a script.
_API_ROOT = Path(__file__).resolve().parents[1]
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

from app.data import load_world
from app.engine.commands import apply_commands
from app.engine.simulate import settle_turn
from app.engine.state import GameState, World, new_game

# ---------------------------------------------------------------------------
# Strategy definitions
# ---------------------------------------------------------------------------

# Each strategy receives (state, world, turn) and issues commands on turn 1.
# Subsequent turns get a no-op (empty list).


def _strategy_narrowbody_hub(state: GameState, world: World, turn: int) -> list[dict]:
    """Lease 3 A320neo, negotiate slots, open 3 routes from HQ."""
    if turn != 1:
        return []
    hq = state.hq_city_id

    # Destination cities paired per HQ; pick the 3 highest-demand non-HQ cities
    # that are reachable by A320neo (range 6300 km).
    a320_range = 6300.0
    from app.engine.state import haversine_km
    hq_city = world.cities[hq]
    reachable = [
        c for c in world.cities.values()
        if c.id != hq and haversine_km(
            hq_city.lat, hq_city.lon, c.lat, c.lon
        ) <= a320_range
    ]
    # Sort by demand_index desc, take top 3
    dests = sorted(reachable, key=lambda c: -c.demand_index)[:3]
    if len(dests) < 2:
        return []  # insufficient reachable cities; skip strategy

    cmds: list[dict] = []
    # Need 3 routes → need 3 HQ slots (start with 2, negotiate 1 more).
    cmds.append({"type": "negotiateSlot", "cityId": hq})
    # Negotiate dest slots
    for dest in dests:
        cmds.append({"type": "negotiateSlot", "cityId": dest.id})
    # Lease 3 aircraft
    for _ in range(3):
        cmds.append({"type": "leaseAircraft", "modelId": "a320neo"})
    # Open routes
    for dest in dests:
        cmds.append({"type": "openRoute", "cityA": hq, "cityB": dest.id})
    # Assign one aircraft per route (ac-1 → rt-1, ac-2 → rt-2, ac-3 → rt-3)
    for i, dest in enumerate(dests, start=1):
        cmds.append({
            "type": "assignAircraft",
            "aircraftId": f"ac-{i}",
            "routeId": f"rt-{i}",
        })
    return cmds


def _strategy_widebody_premium(state: GameState, world: World, turn: int) -> list[dict]:
    """Buy 2 787-9, open 1 long-haul route at premium fare."""
    if turn != 1:
        return []
    hq = state.hq_city_id

    b787_range = 14140.0
    from app.engine.state import haversine_km
    hq_city = world.cities[hq]
    # Find the farthest high-demand city reachable by 787-9
    candidates = [
        c for c in world.cities.values()
        if c.id != hq and haversine_km(
            hq_city.lat, hq_city.lon, c.lat, c.lon
        ) <= b787_range
    ]
    if not candidates:
        return []
    # Pick highest demand among long-haul candidates (distance > 5000 km preferred)
    long_haul = [
        c for c in candidates
        if haversine_km(hq_city.lat, hq_city.lon, c.lat, c.lon) > 5000
    ]
    dest = sorted(long_haul or candidates, key=lambda c: -c.demand_index)[0]

    cmds: list[dict] = []
    # Buy 2 × 787-9 (each $292M; starting cash $420M — can only afford 1, use lease for 2nd)
    cmds.append({"type": "leaseAircraft", "modelId": "b787-9"})
    cmds.append({"type": "leaseAircraft", "modelId": "b787-9"})
    cmds.append({"type": "negotiateSlot", "cityId": dest.id})
    cmds.append({"type": "openRoute", "cityA": hq, "cityB": dest.id})
    # Assign both aircraft
    cmds.append({"type": "assignAircraft", "aircraftId": "ac-1", "routeId": "rt-1"})
    cmds.append({"type": "assignAircraft", "aircraftId": "ac-2", "routeId": "rt-1"})
    # Premium fare, top service tier
    cmds.append({
        "type": "updateRoute",
        "routeId": "rt-1",
        "fareMult": 1.6,
        "serviceTier": 3,
    })
    return cmds


def _strategy_budget(state: GameState, world: World, turn: int) -> list[dict]:
    """Lease 3 A320neo, 3 routes, discount fares (0.8) and basic service."""
    if turn != 1:
        return []
    hq = state.hq_city_id

    a320_range = 6300.0
    from app.engine.state import haversine_km
    hq_city = world.cities[hq]
    reachable = [
        c for c in world.cities.values()
        if c.id != hq and haversine_km(
            hq_city.lat, hq_city.lon, c.lat, c.lon
        ) <= a320_range
    ]
    dests = sorted(reachable, key=lambda c: -c.demand_index)[:3]
    if len(dests) < 2:
        return []

    cmds: list[dict] = []
    cmds.append({"type": "negotiateSlot", "cityId": hq})
    for dest in dests:
        cmds.append({"type": "negotiateSlot", "cityId": dest.id})
    for _ in range(3):
        cmds.append({"type": "leaseAircraft", "modelId": "a320neo"})
    for dest in dests:
        cmds.append({"type": "openRoute", "cityA": hq, "cityB": dest.id})
    for i, dest in enumerate(dests, start=1):
        cmds.append({
            "type": "assignAircraft",
            "aircraftId": f"ac-{i}",
            "routeId": f"rt-{i}",
        })
    # Set discount fares on all routes
    for i in range(1, len(dests) + 1):
        cmds.append({
            "type": "updateRoute",
            "routeId": f"rt-{i}",
            "fareMult": 0.8,
            "serviceTier": 1,
        })
    return cmds


def _strategy_idle(_state: GameState, _world: World, _turn: int) -> list[dict]:
    """No commands — measures pure overhead drain."""
    return []


STRATEGIES: dict[str, Callable[[GameState, World, int], list[dict]]] = {
    "narrowbody-hub": _strategy_narrowbody_hub,
    "widebody-premium": _strategy_widebody_premium,
    "budget": _strategy_budget,
    "idle": _strategy_idle,
}

HQ_CHOICES = ["nyc", "hnd", "lhr"]


# ---------------------------------------------------------------------------
# Simulation runner
# ---------------------------------------------------------------------------


def run_game(
    world: World,
    strategy_fn: Callable,
    hq: str,
    game_id: str,
    n_turns: int,
) -> dict:
    """Simulate one complete game and return summary metrics."""
    state = new_game(game_id, f"{game_id}-airline", world.cities[hq])

    for turn_num in range(1, n_turns + 1):
        if state.status != "active":
            break

        cmds = strategy_fn(state, world, turn_num)
        if cmds:
            apply_commands(state, world, cmds)

        if state.status != "active":
            break

        settle_turn(state, world, event_pool=[])  # empty pool = deterministic

    # Determine win: rank 1 in final result, or highest market share
    won = False
    if state.final_result is not None:
        won = state.final_result.victory
    elif state.status == "active":
        # Game ended before turn 80 somehow? Check market share vs all competitors
        won = all(state.market_share > c.market_share for c in state.competitors)

    return {
        "cash": state.cash,
        "cumulative_profit": state.lifetime.profit,
        "market_share": state.market_share,
        "bankrupt": state.status == "bankrupt",
        "won": won,
    }


def run_simulation(n_turns: int, n_games: int) -> list[dict]:
    """Run all strategy × HQ combinations and return aggregate rows."""
    world = load_world()
    rows = []

    for strategy_name, strategy_fn in STRATEGIES.items():
        for hq in HQ_CHOICES:
            results = []
            for i in range(n_games):
                game_id = f"sim-{strategy_name}-{hq}-{i}"
                result = run_game(world, strategy_fn, hq, game_id, n_turns)
                results.append(result)

            n = len(results)
            avg_cash = sum(r["cash"] for r in results) / n
            avg_profit = sum(r["cumulative_profit"] for r in results) / n
            avg_share = sum(r["market_share"] for r in results) / n
            bankruptcies = sum(1 for r in results if r["bankrupt"])
            wins = sum(1 for r in results if r["won"])

            rows.append({
                "strategy": strategy_name,
                "hq": hq,
                "avg_cash": avg_cash,
                "cum_profit": avg_profit,
                "final_share": avg_share,
                "bankruptcies": f"{bankruptcies}/{n}",
                "win_rate": f"{wins * 100 // n}%",
            })

    return rows


def _fmt_money(amount: float) -> str:
    """Format dollar amount compactly, e.g. $1.23M or -$45.6M."""
    if abs(amount) >= 1_000_000:
        return f"${amount / 1_000_000:+.1f}M"
    return f"${amount:+,.0f}"


def print_table(rows: list[dict]) -> None:
    header = f"{'strategy':<20} {'hq':<6} {'avg_cash':>10} {'cum_profit':>12} {'final_share':>12} {'bankruptcies':>14} {'win_rate':>9}"
    separator = "-" * len(header)
    print(separator)
    print(header)
    print(separator)
    for r in rows:
        print(
            f"{r['strategy']:<20} {r['hq']:<6} "
            f"{_fmt_money(r['avg_cash']):>10} "
            f"{_fmt_money(r['cum_profit']):>12} "
            f"{r['final_share'] * 100:>11.1f}% "
            f"{r['bankruptcies']:>14} "
            f"{r['win_rate']:>9}"
        )
    print(separator)


def main() -> None:
    parser = argparse.ArgumentParser(description="SkyEmpire balance simulator")
    parser.add_argument("--turns", type=int, default=80, help="turns per game (default 80)")
    parser.add_argument("--games", type=int, default=5, help="games per strategy×HQ (default 5)")
    args = parser.parse_args()

    t0 = time.perf_counter()
    rows = run_simulation(args.turns, args.games)
    elapsed = time.perf_counter() - t0

    print(f"\nSkyEmpire Balance Sim — {args.turns} turns × {args.games} games/combo\n")
    print_table(rows)
    print(f"\nCompleted in {elapsed:.1f}s")


if __name__ == "__main__":
    main()
