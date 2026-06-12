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
    news: list[NewsItem] = field(default_factory=list)
    finance: Finance = field(default_factory=Finance)
    status: Literal["active", "bankrupt"] = "active"
    # Engine-internal bookkeeping — not exposed through the API schemas.
    negative_cash_quarters: int = 0
    next_aircraft_seq: int = 1
    next_route_seq: int = 1


def new_game(game_id: str, airline_name: str, hq_city: City) -> GameState:
    """Starting conditions per CONTRACT §3: $420M cash, no fleet/routes, 2026 Q3."""
    return GameState(
        id=game_id,
        airline_name=airline_name,
        hq_city_id=hq_city.id,
        turn=1,
        year=balance.START_YEAR,
        quarter=balance.START_QUARTER,
        cash=balance.STARTING_CASH,
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
