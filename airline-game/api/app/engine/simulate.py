"""Quarter settlement — the economy formulas of CONTRACT.md §3, verbatim.

Pure functions over engine state; no FastAPI, no storage, no I/O. All numeric
constants come from ``balance.py``.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

from app.engine import balance
from app.engine.competitors import competitor_route_capacity, evolve_competitors
from app.engine.state import (
    AircraftModel,
    FinanceHistoryEntry,
    FinanceTotals,
    GameState,
    NewsItem,
    Route,
    RouteQuarterStats,
    World,
    ensure_active,
    get_aircraft,
    haversine_km,
)


@dataclass
class RouteTurnStats(RouteQuarterStats):
    route_id: str = ""


@dataclass
class TurnReport:
    turn: int
    year: int
    quarter: int
    route_stats: list[RouteTurnStats] = field(default_factory=list)
    totals: FinanceTotals = field(default_factory=lambda: FinanceTotals(0.0, 0.0, 0.0))
    news: list[NewsItem] = field(default_factory=list)


# --- Formula helpers (shared with command validation) -------------------------


def block_hours_per_flight(distance_km: float, cruise_kmh: float) -> float:
    return distance_km / cruise_kmh + balance.TURNAROUND_HOURS


def weekly_block_hours(
    distance_km: float, cruise_kmh: float, weekly_flights: float
) -> float:
    """Total weekly block hours flown on a route (both directions)."""
    return weekly_flights * 2 * block_hours_per_flight(distance_km, cruise_kmh)


def fare_usd(distance_km: float, fare_mult: float) -> float:
    return (balance.FARE_FIXED + balance.FARE_PER_KM * distance_km) * fare_mult


def market_pax(
    demand_a: int, demand_b: int, quarter: int, distance_km: float
) -> float:
    """Two-way total addressable demand, pax per quarter."""
    distance_decay = math.exp(-distance_km / balance.DISTANCE_DECAY_KM)
    return (
        balance.BASE_K
        * demand_a
        * demand_b
        * balance.SEASON_FACTOR[quarter]
        * distance_decay
    )


def assigned_models(state: GameState, route: Route, world: World) -> list[AircraftModel]:
    models: list[AircraftModel] = []
    for aircraft_id in route.aircraft_ids:
        aircraft = get_aircraft(state, aircraft_id)
        if aircraft is not None:
            models.append(world.aircraft_models[aircraft.model_id])
    return models


def _mean(values: list[float]) -> float:
    return sum(values) / len(values)


def mean_cruise_kmh(models: list[AircraftModel]) -> float:
    return _mean([m.cruise_kmh for m in models])


def price_weight(fare_mult: float) -> float:
    """Price weight of a seller (CONTRACT §3): w = fareMult ** PRICE_ELASTICITY.
    The weight carries the elasticity; M1's separate demandMult is retired."""
    return fare_mult ** balance.PRICE_ELASTICITY


def route_capacity(state: GameState, world: World, route: Route) -> int:
    """Quarterly seats on a player route: Σseats × weeklyFlights × 2 × 13."""
    models = assigned_models(state, route, world)
    if not models or route.weekly_flights <= 0:
        return 0
    return int(
        round(
            sum(m.seats for m in models)
            * route.weekly_flights
            * 2
            * balance.WEEKS_PER_QUARTER
        )
    )


# --- Share competition model (CONTRACT §3, M2.1) -------------------------------


@dataclass
class _Seller:
    weight: float
    capacity: float  # math.inf for the background market
    demand: float = 0.0
    pax: float = 0.0


@dataclass
class MarketAllocation:
    """Quarter pax per seller across every served city pair."""

    route_pax: dict[str, int] = field(default_factory=dict)  # player routeId → pax
    competitor_pax: dict[str, float] = field(default_factory=dict)  # aiId → pax
    background_pax: float = 0.0

    @property
    def player_pax(self) -> int:
        return sum(self.route_pax.values())

    @property
    def total_pax(self) -> float:
        return (
            self.player_pax
            + sum(self.competitor_pax.values())
            + self.background_pax
        )


def allocate_city_pair(market: float, sellers: list[_Seller]) -> None:
    """One city pair (CONTRACT §3): share_i = w_i / Σw (the background, weight
    W_BG, is one of the sellers), pax_i = min(capacity_i, market × w_i × share_i),
    then exactly one deterministic redistribution pass that hands the
    capacity-capped sellers' unmet demand to the non-capped ones, weight-wise."""
    total_weight = sum(seller.weight for seller in sellers)
    if total_weight <= 0:
        return
    for seller in sellers:
        seller.demand = market * seller.weight * (seller.weight / total_weight)
        seller.pax = min(seller.capacity, seller.demand)
    unmet = sum(seller.demand - seller.pax for seller in sellers)
    if unmet <= 0:
        return
    uncapped = [seller for seller in sellers if seller.pax < seller.capacity]
    uncapped_weight = sum(seller.weight for seller in uncapped)
    if uncapped_weight <= 0:
        return
    for seller in uncapped:
        seller.pax = min(
            seller.capacity, seller.pax + unmet * seller.weight / uncapped_weight
        )


def allocate_market(state: GameState, world: World, quarter: int) -> MarketAllocation:
    """Run the share competition on every city pair served by the player or an
    AI. Pairs are independent, so a stable pair order keeps this deterministic."""
    player_routes: dict[frozenset[str], Route] = {
        frozenset((route.city_a, route.city_b)): route for route in state.routes
    }
    ai_routes: dict[frozenset[str], list[tuple[str, float, int]]] = {}
    pair_order: list[frozenset[str]] = list(player_routes)
    for competitor in state.competitors:
        for ai_route in competitor.routes:
            pair = frozenset((ai_route.city_a, ai_route.city_b))
            if pair not in player_routes and pair not in ai_routes:
                pair_order.append(pair)
            ai_routes.setdefault(pair, []).append(
                (
                    competitor.id,
                    competitor.fare_mult,
                    competitor_route_capacity(ai_route),
                )
            )

    allocation = MarketAllocation()
    for pair in pair_order:
        city_a, city_b = (world.cities[city_id] for city_id in pair)
        player_route = player_routes.get(pair)
        distance = (
            player_route.distance_km
            if player_route is not None
            else round(haversine_km(city_a.lat, city_a.lon, city_b.lat, city_b.lon), 1)
        )
        market = market_pax(
            city_a.demand_index, city_b.demand_index, quarter, distance
        )

        sellers: list[_Seller] = []
        if player_route is not None:
            sellers.append(
                _Seller(
                    weight=price_weight(player_route.fare_mult),
                    capacity=route_capacity(state, world, player_route),
                )
            )
        ai_sellers = ai_routes.get(pair, [])
        for _, fare_mult, capacity in ai_sellers:
            sellers.append(_Seller(weight=price_weight(fare_mult), capacity=capacity))
        background = _Seller(weight=balance.W_BG, capacity=math.inf)
        sellers.append(background)

        allocate_city_pair(market, sellers)

        cursor = 0
        if player_route is not None:
            allocation.route_pax[player_route.id] = int(round(sellers[cursor].pax))
            cursor += 1
        for (competitor_id, _, _), seller in zip(ai_sellers, sellers[cursor:]):
            allocation.competitor_pax[competitor_id] = (
                allocation.competitor_pax.get(competitor_id, 0.0) + seller.pax
            )
        allocation.background_pax += background.pax
    return allocation


def update_market_shares(state: GameState, allocation: MarketAllocation) -> None:
    """marketShare (same yardstick for player and AIs, CONTRACT §3): own pax ÷
    total pax of every seller incl. the background; 0 with no routes/traffic."""
    total = allocation.total_pax
    state.market_share = (
        round(allocation.player_pax / total, 4) if total > 0 else 0.0
    )
    for competitor in state.competitors:
        pax = allocation.competitor_pax.get(competitor.id, 0.0)
        competitor.market_share = round(pax / total, 4) if total > 0 else 0.0


def simulate_route(
    state: GameState, world: World, route: Route, quarter: int, pax: int
) -> RouteQuarterStats:
    """One route's quarter per CONTRACT §3; ``pax`` comes from the share
    competition model (``allocate_market``). A route with no assigned aircraft
    flies nothing and costs nothing."""
    models = assigned_models(state, route, world)
    if not models or route.weekly_flights <= 0:
        return RouteQuarterStats(0, 0, 0.0, 0.0, 0.0, 0.0)

    city_a = world.cities[route.city_a]
    city_b = world.cities[route.city_b]
    distance = route.distance_km
    flights = route.weekly_flights * 2 * balance.WEEKS_PER_QUARTER

    capacity = route_capacity(state, world, route)
    load_factor = round(pax / capacity, 4) if capacity else 0.0

    revenue = round(pax * fare_usd(distance, route.fare_mult), 2)

    mean_fuel = _mean([m.fuel_kg_per_km for m in models])
    mean_cruise = _mean([m.cruise_kmh for m in models])
    fuel_cost = distance * mean_fuel * balance.FUEL_USD_PER_KG * flights
    airport_cost = (city_a.slot_fee + city_b.slot_fee) * flights
    block_hours = flights * block_hours_per_flight(distance, mean_cruise)
    crew_maint_cost = block_hours * balance.CREW_MAINT_USD_PER_BH
    cost = round(fuel_cost + airport_cost + crew_maint_cost, 2)

    return RouteQuarterStats(
        pax=pax,
        capacity=capacity,
        load_factor=load_factor,
        revenue=revenue,
        cost=cost,
        profit=round(revenue - cost, 2),
    )


def fleet_holding_cost(state: GameState, world: World) -> float:
    """Quarterly holding cost; idle aircraft pay it too (CONTRACT §3)."""
    total = 0.0
    for aircraft in state.fleet:
        price = world.aircraft_models[aircraft.model_id].price
        rate = (
            balance.DEPRECIATION_Q
            if aircraft.ownership == "owned"
            else balance.LEASE_RATE_Q
        )
        total += price * rate
    return total


def overhead_cost(state: GameState) -> float:
    return balance.HQ_OVERHEAD + balance.ADMIN_PER_AIRCRAFT * len(state.fleet)


def settle_turn(state: GameState, world: World) -> TurnReport:
    """Settle the current quarter, mutate state (cash, finance, calendar,
    status, news) and return the TurnReport for that settled quarter."""
    ensure_active(state)

    turn, year, quarter = state.turn, state.year, state.quarter

    # AI airlines evolve before settlement (CONTRACT §3, M2.1).
    ai_news = evolve_competitors(state, world)

    allocation = allocate_market(state, world, quarter)
    update_market_shares(state, allocation)

    route_stats: list[RouteTurnStats] = []
    routes_revenue = 0.0
    routes_cost = 0.0
    for route in state.routes:
        stats = simulate_route(
            state, world, route, quarter, allocation.route_pax.get(route.id, 0)
        )
        route.last_quarter = stats
        route_stats.append(RouteTurnStats(**vars(stats), route_id=route.id))
        routes_revenue += stats.revenue
        routes_cost += stats.cost

    revenue = round(routes_revenue, 2)
    cost = round(routes_cost + fleet_holding_cost(state, world) + overhead_cost(state), 2)
    profit = round(revenue - cost, 2)
    totals = FinanceTotals(revenue=revenue, cost=cost, profit=profit)

    state.cash = round(state.cash + profit, 2)
    state.finance.last_quarter = totals
    state.finance.history.append(
        FinanceHistoryEntry(turn=turn, cash=state.cash, profit=profit)
    )

    news = [
        NewsItem(
            headline=f"{year} 年 Q{quarter} 结算完成",
            detail=(
                f"营收 ${revenue:,.0f}，成本 ${cost:,.0f}，"
                f"利润 ${profit:,.0f}，现金 ${state.cash:,.0f}。"
            ),
            kind="system",
        ),
        *ai_news,
    ]

    if state.cash < 0:
        state.negative_cash_quarters += 1
        if state.negative_cash_quarters >= balance.BANKRUPTCY_CONSECUTIVE_QUARTERS:
            state.status = "bankrupt"
            news.append(
                NewsItem(
                    headline=f"{state.airline_name} 宣告破产",
                    detail="现金连续两个季度为负，公司进入清算程序。",
                    kind="system",
                )
            )
        else:
            news.append(
                NewsItem(
                    headline="财务警报：现金为负",
                    detail="若下季度结束时现金仍为负，公司将破产。",
                    kind="system",
                )
            )
    else:
        state.negative_cash_quarters = 0

    state.news = news

    # Advance the calendar (start: 2026 Q3).
    state.turn += 1
    if quarter == 4:
        state.year += 1
        state.quarter = 1
    else:
        state.quarter = quarter + 1

    return TurnReport(
        turn=turn,
        year=year,
        quarter=quarter,
        route_stats=route_stats,
        totals=totals,
        news=news,
    )
