"""Quarter settlement — the economy formulas of CONTRACT.md §3, verbatim.

Pure functions over engine state; no FastAPI, no storage, no I/O. All numeric
constants come from ``balance.py``.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

from app.engine import balance
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


def simulate_route(
    state: GameState, world: World, route: Route, quarter: int
) -> RouteQuarterStats:
    """One route's quarter per CONTRACT §3. A route with no assigned aircraft
    flies nothing and costs nothing."""
    models = assigned_models(state, route, world)
    if not models or route.weekly_flights <= 0:
        return RouteQuarterStats(0, 0, 0.0, 0.0, 0.0, 0.0)

    city_a = world.cities[route.city_a]
    city_b = world.cities[route.city_b]
    distance = route.distance_km
    flights = route.weekly_flights * 2 * balance.WEEKS_PER_QUARTER

    capacity = int(round(sum(m.seats for m in models)
                         * route.weekly_flights * 2 * balance.WEEKS_PER_QUARTER))
    market = market_pax(city_a.demand_index, city_b.demand_index, quarter, distance)
    demand_mult = route.fare_mult ** balance.PRICE_ELASTICITY
    pax = int(round(min(capacity, market * balance.SHARE_BASE * demand_mult)))
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
    route_stats: list[RouteTurnStats] = []
    routes_revenue = 0.0
    routes_cost = 0.0
    for route in state.routes:
        stats = simulate_route(state, world, route, quarter)
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
        )
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
