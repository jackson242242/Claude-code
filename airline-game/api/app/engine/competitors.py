"""AI rival airlines (CONTRACT.md §3, M2.1): fixed definitions + per-turn
evolution.

Pure functions over engine state; no FastAPI, no storage, no I/O. Every rule
here is fully deterministic — ties are broken by the stable order of the city
table — so the contract's pseudo-random fallback seed ``hash(gameId, turn,
aiId)`` is never actually needed.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from app.engine import balance
from app.engine.state import (
    Competitor,
    CompetitorRoute,
    GameState,
    NewsItem,
    World,
    pool_slots_taken,
)


@dataclass(frozen=True)
class _AISpec:
    id: str
    name: str
    name_zh: str
    hq_city_id: str
    fare_mult: float
    initial_routes: tuple[tuple[str, str], ...]


# Fixed roster (CONTRACT §3). Initial routes deliberately avoid every nyc city
# pair so the four M1 balance acceptance scenarios stay competition-free.
AI_SPECS: tuple[_AISpec, ...] = (
    _AISpec(
        id="ai-aurora",
        name="Aurora Pacific",
        name_zh="极光太平洋航空",
        hq_city_id="hnd",
        fare_mult=0.95,
        initial_routes=(("hnd", "pvg"), ("hnd", "sin")),
    ),
    _AISpec(
        id="ai-meridian",
        name="Royal Meridian",
        name_zh="皇家子午线航空",
        hq_city_id="lhr",
        fare_mult=1.1,
        initial_routes=(("lhr", "fra"), ("lhr", "dxb")),
    ),
    _AISpec(
        id="ai-falcon",
        name="Falcon Dunes",
        name_zh="沙丘猎鹰航空",
        hq_city_id="dxb",
        fare_mult=1.0,
        initial_routes=(("dxb", "sin"), ("dxb", "cdg")),
    ),
)


def initial_competitors() -> list[Competitor]:
    """The three AI airlines in their fixed starting positions."""
    return [
        Competitor(
            id=spec.id,
            name=spec.name,
            name_zh=spec.name_zh,
            hq_city_id=spec.hq_city_id,
            fare_mult=spec.fare_mult,
            routes=[
                CompetitorRoute(
                    city_a=a, city_b=b, weekly_seats=balance.AI_INITIAL_WEEKLY_SEATS
                )
                for a, b in spec.initial_routes
            ],
        )
        for spec in AI_SPECS
    ]


def competitor_route_capacity(route: CompetitorRoute) -> int:
    """Quarterly seats, same accounting as the player: both directions, 13 weeks."""
    return route.weekly_seats * 2 * balance.WEEKS_PER_QUARTER


def _served_cities(competitor: Competitor) -> set[str]:
    served = {competitor.hq_city_id}
    for route in competitor.routes:
        served.add(route.city_a)
        served.add(route.city_b)
    return served


def _next_destination(
    state: GameState, competitor: Competitor, world: World
) -> str | None:
    """Highest-demandIndex city the AI does not serve yet; ties broken by the
    stable order of the city table (deterministic, no randomness needed).
    M2.2: a candidate whose slot pool is full (taken ≥ capacity) is skipped and
    the next candidate is taken instead — also fully deterministic."""
    served = _served_cities(competitor)
    candidates = sorted(
        (city for city in world.cities.values() if city.id not in served),
        key=lambda city: -city.demand_index,  # stable sort keeps table order
    )
    for city in candidates:
        if pool_slots_taken(state, city.id) < city.slot_capacity:
            return city.id
    return None


def evolve_competitors(state: GameState, world: World) -> list[NewsItem]:
    """Pre-settlement evolution (CONTRACT §3): every turn the largest route of
    each AI grows ×AI_GROWTH_FACTOR (ceil, capped at AI_ROUTE_MAX_WEEKLY_SEATS); every 4th turn each AI opens a new HQ route to
    its best unserved city, announced as a system NewsItem."""
    news: list[NewsItem] = []
    for competitor in state.competitors:
        if competitor.routes:
            largest = max(competitor.routes, key=lambda r: r.weekly_seats)
            # round(…, 6) before ceil keeps binary-float noise (e.g.
            # e.g. 2200 × 1.05 → float noise) from inflating the ceiling.
            largest.weekly_seats = math.ceil(
                round(largest.weekly_seats * balance.AI_GROWTH_FACTOR, 6)
            )
        if state.turn % balance.AI_NEW_ROUTE_EVERY_TURNS == 0:
            # AI routes opened earlier this turn already count in the pool
            # (pool occupancy is derived from state), so the skip-when-full
            # rule sees them — order of the fixed roster keeps it deterministic.
            destination_id = _next_destination(state, competitor, world)
            if destination_id is None:
                continue
            competitor.routes.append(
                CompetitorRoute(
                    city_a=competitor.hq_city_id,
                    city_b=destination_id,
                    weekly_seats=balance.AI_NEW_ROUTE_WEEKLY_SEATS,
                )
            )
            hq = world.cities[competitor.hq_city_id]
            destination = world.cities[destination_id]
            news.append(
                NewsItem(
                    headline=(
                        f"{competitor.name_zh} 开通 "
                        f"{hq.name_zh} — {destination.name_zh} 航线"
                    ),
                    detail=(
                        f"{competitor.name}（{competitor.name_zh}）新增 "
                        f"{hq.name} — {destination.name} 航线，"
                        f"每周每方向 {balance.AI_NEW_ROUTE_WEEKLY_SEATS:,} 个座位。"
                    ),
                    kind="system",
                )
            )
    return news
