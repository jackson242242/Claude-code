"""API schemas — the JSON shapes of CONTRACT.md §2, camelCase on the wire via
the Pydantic alias generator (same convention as the repo root backend)."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )


class City(CamelModel):
    id: str
    name: str
    name_zh: str
    country: str
    lat: float
    lon: float
    demand_index: int
    slot_fee: float
    slot_capacity: int


class CitySlotInfo(CamelModel):
    """M2.2 slot-market snapshot for one city (CONTRACT §2), computed
    server-side on every GameState response."""

    capacity: int
    taken: int
    player_held: int
    player_used: int


class AircraftModel(CamelModel):
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


class FleetAircraft(CamelModel):
    id: str
    model_id: str
    ownership: Literal["owned", "leased"]
    route_id: str | None = None


class RouteQuarterStats(CamelModel):
    pax: int
    capacity: int
    load_factor: float
    revenue: float
    cost: float
    profit: float


class Route(CamelModel):
    id: str
    city_a: str
    city_b: str
    distance_km: float
    aircraft_ids: list[str]
    weekly_flights: float
    fare_mult: float
    last_quarter: RouteQuarterStats | None = None


class CompetitorRoute(CamelModel):
    city_a: str
    city_b: str
    weekly_seats: int


class Competitor(CamelModel):
    id: str
    name: str
    name_zh: str
    hq_city_id: str
    fare_mult: float
    routes: list[CompetitorRoute]
    market_share: float


class NewsItem(CamelModel):
    headline: str
    detail: str | None = None
    kind: Literal["system", "event"] = "system"


class FinanceTotals(CamelModel):
    revenue: float
    cost: float
    profit: float


class FinanceHistoryEntry(CamelModel):
    turn: int
    cash: float
    profit: float


class Finance(CamelModel):
    last_quarter: FinanceTotals | None = None
    history: list[FinanceHistoryEntry] = Field(default_factory=list)


class GameState(CamelModel):
    id: str
    airline_name: str
    hq_city_id: str
    turn: int
    year: int
    quarter: Literal[1, 2, 3, 4]
    cash: float
    fleet: list[FleetAircraft]
    routes: list[Route]
    competitors: list[Competitor]
    market_share: float
    # Filled by the routes layer from engine.state.compute_slot_market (the
    # engine GameState has no such attribute — it is a derived snapshot).
    slot_market: dict[str, CitySlotInfo] = Field(default_factory=dict)
    news: list[NewsItem]
    finance: Finance
    status: Literal["active", "bankrupt"]


class RouteTurnStats(RouteQuarterStats):
    route_id: str


class TurnReport(CamelModel):
    turn: int
    year: int
    quarter: int
    route_stats: list[RouteTurnStats]
    totals: FinanceTotals
    news: list[NewsItem]


class CommandResult(CamelModel):
    index: int
    ok: bool
    message: str | None = None


# --- Request / response envelopes ---------------------------------------------


class MetaResponse(CamelModel):
    cities: list[City]
    aircraft_models: list[AircraftModel]


class CreateGameRequest(CamelModel):
    airline_name: str
    hq_city_id: str


class CommandsRequest(CamelModel):
    # Commands are validated individually by the engine so that one bad
    # command yields ok=false without failing the whole request (CONTRACT §1).
    commands: list[dict[str, Any]]


class CommandsResponse(CamelModel):
    state: GameState
    results: list[CommandResult]


class EndTurnResponse(CamelModel):
    state: GameState
    report: TurnReport
