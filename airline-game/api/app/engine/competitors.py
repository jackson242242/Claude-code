"""AI rival airlines (CONTRACT.md §3, V3.10): fixed definitions + per-turn
evolution with per-style management behaviour.

Pure functions over engine state; no FastAPI, no storage, no I/O. Every rule
here is fully deterministic — ties are broken by the stable order of the city
table — so the contract's pseudo-random fallback seed ``hash(gameId, turn,
aiId)`` is never actually needed.

V3.10 management styles (CONTRACT §3 V3.10):
  aggressive — new route every 4 turns, growth ×1.07, cap 3600.
  premium    — growth ×1.03, max 8 routes, +5% share-weight bonus.
  budget     — marketShare-triggered fare cut (0.92 when share < 0.12).
  network    — open new routes from HQ preferring cities already served by others.
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
    style: str
    style_zh: str
    initial_routes: tuple[tuple[str, str], ...]


# Fixed roster (CONTRACT §3 V3.10). Initial routes deliberately avoid every
# nyc city pair so the four M1 balance acceptance scenarios stay
# competition-free.
AI_SPECS: tuple[_AISpec, ...] = (
    _AISpec(
        id="ai-aurora",
        name="Aurora Pacific",
        name_zh="极光太平洋航空",
        hq_city_id="hnd",
        fare_mult=0.95,
        style="budget",
        style_zh="价格屠夫",
        initial_routes=(("hnd", "pvg"), ("hnd", "sin")),
    ),
    _AISpec(
        id="ai-meridian",
        name="Royal Meridian",
        name_zh="皇家子午线航空",
        hq_city_id="lhr",
        fare_mult=1.1,
        style="premium",
        style_zh="精品保守派",
        initial_routes=(("lhr", "fra"), ("lhr", "dxb")),
    ),
    _AISpec(
        id="ai-falcon",
        name="Falcon Dunes",
        name_zh="沙丘猎鹰航空",
        hq_city_id="dxb",
        fare_mult=1.0,
        style="network",
        style_zh="网络枢纽派",
        initial_routes=(("dxb", "sin"), ("dxb", "cdg")),
    ),
    _AISpec(
        id="ai-vector",
        name="Vector Sky",
        name_zh="矢量天空航空",
        hq_city_id="icn",
        fare_mult=1.0,
        style="aggressive",
        style_zh="激进扩张派",
        initial_routes=(("icn", "pvg"), ("icn", "bkk")),
    ),
)


def initial_competitors() -> list[Competitor]:
    """The four AI airlines in their fixed starting positions."""
    return [
        Competitor(
            id=spec.id,
            name=spec.name,
            name_zh=spec.name_zh,
            hq_city_id=spec.hq_city_id,
            fare_mult=spec.fare_mult,
            style=spec.style,
            style_zh=spec.style_zh,
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


def _style_params(competitor: Competitor) -> dict:
    """Return the style-specific parameter overrides for this competitor."""
    return balance.AI_STYLES.get(competitor.style, {})


def _effective_fare_mult(competitor: Competitor) -> float:
    """V3.10 budget style: effective fareMult may be lower when in price-war mode.

    For budget AIs: if last marketShare < price_war_threshold → use
    price_war_fare_mult instead of the base fareMult.
    For all other styles: return the base fareMult unchanged.
    """
    params = _style_params(competitor)
    threshold = params.get("price_war_threshold")
    if threshold is not None and competitor.market_share < threshold:
        return params.get("price_war_fare_mult", competitor.fare_mult)
    return competitor.fare_mult


def get_competitor_weight_bonus(competitor: Competitor) -> float:
    """V3.10 premium style: returns the share-weight multiplier for this competitor.

    premium → 1.05; all other styles → 1.0 (no bonus).
    """
    params = _style_params(competitor)
    return params.get("weight_bonus", 1.0)


def effective_fare_mult(competitor: Competitor) -> float:
    """Public wrapper for the effective fareMult (used in simulate.py share model)."""
    return _effective_fare_mult(competitor)


def _served_cities(competitor: Competitor) -> set[str]:
    served = {competitor.hq_city_id}
    for route in competitor.routes:
        served.add(route.city_a)
        served.add(route.city_b)
    return served


def _all_served_cities(state: GameState) -> set[str]:
    """Union of all cities served by the player and any AI (for network style)."""
    served: set[str] = set()
    for route in state.routes:
        served.add(route.city_a)
        served.add(route.city_b)
    for competitor in state.competitors:
        served |= _served_cities(competitor)
    return served


def _next_destination(
    state: GameState, competitor: Competitor, world: World
) -> str | None:
    """Choose the best unserved city for the AI to open a new HQ route to.

    Default (and budget/aggressive/premium): highest demandIndex city not yet
    served; ties broken by stable city-table order; skip if slot pool is full.

    V3.10 network style: first prefer cities already served by OTHER carriers
    (player or any AI), then fall back to demandIndex ordering.  Within each
    tier the ordering is: demandIndex descending, then city-table order
    (stable, deterministic, no randomness needed).
    """
    served = _served_cities(competitor)
    params = _style_params(competitor)

    if params.get("prefer_served_by_others"):
        others_served = _all_served_cities(state) - served
        # Separate candidates into served-by-others and not.
        others_candidates = sorted(
            (c for c in world.cities.values() if c.id not in served and c.id in others_served),
            key=lambda c: -c.demand_index,
        )
        remaining_candidates = sorted(
            (c for c in world.cities.values() if c.id not in served and c.id not in others_served),
            key=lambda c: -c.demand_index,
        )
        candidates = others_candidates + remaining_candidates
    else:
        candidates = sorted(
            (city for city in world.cities.values() if city.id not in served),
            key=lambda city: -city.demand_index,  # stable sort keeps table order
        )

    for city in candidates:
        if pool_slots_taken(state, city.id) < city.slot_capacity:
            return city.id
    return None


def _new_route_every_turns(competitor: Competitor) -> int:
    """V3.10: per-style cadence for opening new routes."""
    params = _style_params(competitor)
    return params.get("new_route_every_turns", balance.AI_NEW_ROUTE_EVERY_TURNS)


def _growth_factor(competitor: Competitor) -> float:
    """V3.10: per-style seat growth factor."""
    params = _style_params(competitor)
    return params.get("growth_factor", balance.AI_GROWTH_FACTOR)


def _route_max_weekly_seats(competitor: Competitor) -> int:
    """V3.10: per-style per-route seat cap."""
    params = _style_params(competitor)
    return params.get("route_max_weekly_seats", balance.AI_ROUTE_MAX_WEEKLY_SEATS)


def _max_routes(competitor: Competitor) -> int | None:
    """V3.10: per-style max route count (None = unlimited)."""
    params = _style_params(competitor)
    return params.get("max_routes")


def evolve_competitors(state: GameState, world: World) -> list[NewsItem]:
    """Pre-settlement evolution (CONTRACT §3 V3.10): every turn the largest route
    of each AI grows ×growth_factor (ceil, capped at route_max_weekly_seats);
    every N turns (per style) each AI opens a new HQ route to its best unserved
    city, announced as a system NewsItem.

    V3.10 style rules applied here:
    - aggressive: growth ×1.07, cap 3600, opens every 4 turns.
    - premium: growth ×1.03, max 8 routes total.
    - budget: growth ×1.05, cap 3200 (unchanged base behaviour except fare
      handled in share model via effective_fare_mult).
    - network: routing preference applied in _next_destination.
    """
    news: list[NewsItem] = []
    for competitor in state.competitors:
        if competitor.routes:
            largest = max(competitor.routes, key=lambda r: r.weekly_seats)
            growth = _growth_factor(competitor)
            cap = _route_max_weekly_seats(competitor)
            # round(…, 6) before ceil keeps binary-float noise from inflating
            # the ceiling (e.g. 2200 × 1.05 float noise).
            new_seats = min(
                math.ceil(round(largest.weekly_seats * growth, 6)),
                cap,
            )
            largest.weekly_seats = new_seats

        cadence = _new_route_every_turns(competitor)
        if state.turn % cadence == 0:
            # Check premium max_routes cap before opening.
            max_rt = _max_routes(competitor)
            if max_rt is not None and len(competitor.routes) >= max_rt:
                continue

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
            # NEWS: headline uses the i18n-matched template "X 开通 A — B 航线";
            # style flavor is placed in the detail field only (CONTRACT §3 V3.10:
            # keep headline intact for frontend regex-matching).
            news.append(
                NewsItem(
                    headline=(
                        f"{competitor.name_zh} 开通 "
                        f"{hq.name_zh} — {destination.name_zh} 航线"
                    ),
                    detail=(
                        f"{competitor.name}（{competitor.name_zh}，"
                        f"{competitor.style_zh or competitor.style}）"
                        f"新增 {hq.name} — {destination.name} 航线，"
                        f"每周每方向 {balance.AI_NEW_ROUTE_WEEKLY_SEATS:,} 个座位。"
                    ),
                    kind="system",
                )
            )
    return news
