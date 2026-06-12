"""Engine state: plain dataclasses mirroring CONTRACT.md §2 plus a few
engine-internal bookkeeping fields (id sequences, bankruptcy streak) that are
deliberately *not* part of the API surface.

This module is pure: no FastAPI, no storage, no I/O.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Literal

from app.engine import balance


class GameOverError(Exception):
    """Raised when commands or settlements are attempted on a bankrupt game."""


# --- Static world data (loaded from airline-game/data/*.json by the app layer) --


@dataclass(frozen=True)
class City:
    id: str
    name: str
    name_zh: str
    country: str
    lat: float
    lon: float
    demand_index: int
    slot_fee: float
    slot_capacity: int  # M2.2: total airport slot pool


@dataclass(frozen=True)
class AircraftModel:
    id: str
    manufacturer: str
    name: str
    seats: int
    range_km: float
    cruise_kmh: float
    price: float
    fuel_kg_per_km: float
    introduced: int
    badge: str | None = None


@dataclass(frozen=True)
class World:
    cities: dict[str, City]
    aircraft_models: dict[str, AircraftModel]


# --- Mutable game state -----------------------------------------------------


@dataclass
class FleetAircraft:
    id: str
    model_id: str
    ownership: Literal["owned", "leased"]
    route_id: str | None = None


@dataclass
class RouteQuarterStats:
    pax: int
    capacity: int
    load_factor: float
    revenue: float
    cost: float
    profit: float


@dataclass
class Route:
    id: str
    city_a: str
    city_b: str
    distance_km: float
    aircraft_ids: list[str] = field(default_factory=list)
    weekly_flights: float = balance.DEFAULT_WEEKLY_FLIGHTS
    fare_mult: float = 1.0
    last_quarter: RouteQuarterStats | None = None


@dataclass
class CompetitorRoute:
    city_a: str
    city_b: str
    weekly_seats: int  # per direction per week (CONTRACT §2)


@dataclass
class Competitor:
    id: str
    name: str
    name_zh: str
    hq_city_id: str
    fare_mult: float  # fixed personality: 0.9 budget / 1.0 balanced / 1.1 premium
    routes: list[CompetitorRoute] = field(default_factory=list)
    market_share: float = 0.0  # last quarter's share, 0–1


@dataclass
class NewsItem:
    headline: str
    detail: str | None = None
    kind: Literal["system", "event"] = "system"


@dataclass
class FinanceTotals:
    revenue: float
    cost: float
    profit: float


@dataclass
class FinanceHistoryEntry:
    turn: int
    cash: float
    profit: float


@dataclass
class Finance:
    last_quarter: FinanceTotals | None = None
    history: list[FinanceHistoryEntry] = field(default_factory=list)


@dataclass
class GameState:
    id: str
    airline_name: str
    hq_city_id: str
    turn: int
    year: int
    quarter: int
    cash: float
    fleet: list[FleetAircraft] = field(default_factory=list)
    routes: list[Route] = field(default_factory=list)
    competitors: list[Competitor] = field(default_factory=list)
    market_share: float = 0.0  # player's share of last quarter's served traffic
    news: list[NewsItem] = field(default_factory=list)
    finance: Finance = field(default_factory=Finance)
    status: Literal["active", "bankrupt"] = "active"
    # M2.2 slot system: slots the player holds per city (used or not), and the
    # turn of the last successful negotiation per city (1-per-city-per-turn
    # cooldown). The API exposes these only through the computed slotMarket
    # snapshot (compute_slot_market), never raw.
    slots_held: dict[str, int] = field(default_factory=dict)
    last_negotiation_turn: dict[str, int] = field(default_factory=dict)
    # Engine-internal bookkeeping — not exposed through the API schemas.
    negative_cash_quarters: int = 0
    next_aircraft_seq: int = 1
    next_route_seq: int = 1


def new_game(game_id: str, airline_name: str, hq_city: City) -> GameState:
    """Starting conditions per CONTRACT §3: $420M cash, no fleet/routes, 2026 Q3,
    plus the three fixed AI rival airlines (M2.1)."""
    # Local import: competitors.py needs the dataclasses above, so importing it
    # at module top would be circular.
    from app.engine.competitors import initial_competitors

    return GameState(
        id=game_id,
        airline_name=airline_name,
        hq_city_id=hq_city.id,
        turn=1,
        year=balance.START_YEAR,
        quarter=balance.START_QUARTER,
        cash=balance.STARTING_CASH,
        competitors=initial_competitors(),
        slots_held={hq_city.id: balance.HQ_STARTING_SLOTS},
        news=[
            NewsItem(
                headline=f"{airline_name} 正式成立",
                detail=f"总部设于{hq_city.name_zh}（{hq_city.name}），启动资金 $420M。",
                kind="system",
            )
        ],
    )


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km (CONTRACT §3: haversine)."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return balance.EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


# --- Airport slots (CONTRACT §2/§3, M2.2) ---------------------------------------


@dataclass
class CitySlotInfo:
    """One city's slot-market snapshot (CONTRACT §2 ``CitySlotInfo``)."""

    capacity: int  # total pool = city.slotCapacity
    taken: int  # AI route endpoints (1 per end) + every player-held slot
    player_held: int  # slots the player holds (used or not)
    player_used: int  # player route endpoints (1 per end per route)


def player_slots_used(state: GameState, city_id: str) -> int:
    """Held slots the player's routes occupy at a city: 1 per route end."""
    return sum(
        1 for route in state.routes if city_id in (route.city_a, route.city_b)
    )


def pool_slots_taken(state: GameState, city_id: str) -> int:
    """Pool occupancy (CONTRACT §2 ``taken``): every AI route end at the city
    takes 1 pool slot, plus every slot the player holds there (used or not)."""
    ai_taken = sum(
        1
        for competitor in state.competitors
        for route in competitor.routes
        if city_id in (route.city_a, route.city_b)
    )
    return ai_taken + state.slots_held.get(city_id, 0)


def compute_slot_market(state: GameState, world: World) -> dict[str, CitySlotInfo]:
    """Pure snapshot of the slot market for every city (CONTRACT §3: recomputed
    server-side on each GameState response)."""
    return {
        city.id: CitySlotInfo(
            capacity=city.slot_capacity,
            taken=pool_slots_taken(state, city.id),
            player_held=state.slots_held.get(city.id, 0),
            player_used=player_slots_used(state, city.id),
        )
        for city in world.cities.values()
    }


# --- Lookup helpers -----------------------------------------------------------


def get_aircraft(state: GameState, aircraft_id: str) -> FleetAircraft | None:
    return next((ac for ac in state.fleet if ac.id == aircraft_id), None)


def get_route(state: GameState, route_id: str) -> Route | None:
    return next((rt for rt in state.routes if rt.id == route_id), None)


def find_route_between(state: GameState, city_a: str, city_b: str) -> Route | None:
    pair = {city_a, city_b}
    return next((rt for rt in state.routes if {rt.city_a, rt.city_b} == pair), None)


def ensure_active(state: GameState) -> None:
    if state.status == "bankrupt":
        raise GameOverError("game is bankrupt; no further commands or turns accepted")
