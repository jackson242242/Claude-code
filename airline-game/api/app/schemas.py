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
    # V3.9: city endowment fields
    iata: str = ""
    airport: str = ""
    airport_zh: str = ""
    population: float = 0.0
    tax_relief: float = 0.0
    transit_index: int = 5
    terrain: str = "plain"


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


class CabinMix(CamelModel):
    """M2.3 floor-space percentages; three fields sum to 100."""

    economy: int
    business: int
    first: int


class ClassStats(CamelModel):
    """M2.3 per-cabin-class quarter stats."""

    pax: int
    capacity: int
    revenue: float


class RouteQuarterStats(CamelModel):
    pax: int
    capacity: int
    load_factor: float
    revenue: float
    cost: float
    profit: float
    # M2.3: per-class breakdown; the engine returns a dict keyed by class name.
    classes: dict[str, ClassStats] | None = None


class Route(CamelModel):
    id: str
    city_a: str
    city_b: str
    distance_km: float
    aircraft_ids: list[str]
    weekly_flights: float
    fare_mult: float
    cabin_mix: CabinMix = Field(default_factory=lambda: CabinMix(economy=100, business=0, first=0))
    service_tier: Literal[1, 2, 3] = 2  # M2.3
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


# --- M3.1 dynamic event schemas -----------------------------------------------


class EventEffect(CamelModel):
    target: Literal["fuelCost", "demand", "slotFee", "serviceCost"]
    mult: float


class EventScope(CamelModel):
    kind: Literal["global", "city", "route"]
    ids: list[str] = Field(default_factory=list)


class ActiveEvent(CamelModel):
    id: str
    source: Literal["static", "news"]
    headline: str
    scope: EventScope
    effects: list[EventEffect]
    duration_turns: int
    severity: Literal["minor", "major"]
    detail: str | None = None
    source_url: str | None = None
    started_turn: int
    remaining_turns: int
    # V3.1: optional tri-lingual translations (camelCase on the wire)
    headline_en: str | None = None
    headline_es: str | None = None
    detail_en: str | None = None
    detail_es: str | None = None


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


class Lifetime(CamelModel):
    """M2.4 cumulative lifetime stats (profit + pax across all settled turns)."""

    profit: float = 0.0
    pax: int = 0


class StandingEntry(CamelModel):
    """One row in the final standings table (CONTRACT §2, M2.4)."""

    name: str
    is_player: bool
    market_share: float


class FinalResult(CamelModel):
    """M2.4 end-of-game result; null in GameState until turn 80 settles."""

    rank: int
    victory: bool
    standings: list[StandingEntry]
    cumulative_profit: float
    cumulative_pax: int
    ended_turn: int


# --- V3.7 Brand / Marketing / Decision schemas --------------------------------


class Marketing(CamelModel):
    """V3.7 marketing channel allocation (each 0–10 = $M/quarter)."""

    digital: int = 0
    sponsor: int = 0
    service: int = 0


class DecisionOption(CamelModel):
    """V3.7 one option inside a DecisionEvent."""

    id: str
    label: str
    cash_delta: float
    brand_delta: float
    is_default: bool = False
    label_en: str | None = None
    label_es: str | None = None


class DecisionEvent(CamelModel):
    """V3.7 pending interactive decision in GameState.pendingDecision."""

    id: str
    prompt: str
    options: list[DecisionOption]
    expires_turn: int
    drawn_turn: int
    prompt_en: str | None = None
    prompt_es: str | None = None
    detail: str | None = None
    detail_en: str | None = None
    detail_es: str | None = None


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
    status: Literal["active", "bankrupt", "finished"]
    # M2.4: lifetime stats and final result.
    lifetime: Lifetime = Field(default_factory=Lifetime)
    final_result: FinalResult | None = None
    # M3.1: active events.
    active_events: list[ActiveEvent] = Field(default_factory=list)
    # V3.7: brand, marketing, pending decision.
    brand: float = 50.0
    marketing: Marketing = Field(default_factory=Marketing)
    pending_decision: DecisionEvent | None = None


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
