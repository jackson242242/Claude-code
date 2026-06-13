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
    """Raised when commands or settlements are attempted on a bankrupt or finished game."""


# --- M3.1 dynamic event types --------------------------------------------------


@dataclass
class EventEffect:
    """One effect entry inside a GameEvent (CONTRACT §2, M3.1).
    target: fuelCost | demand | slotFee | serviceCost
    mult: [0.5, 2.0] per single entry; stacked mults clamped to [0.25, 4.0].
    """

    target: str  # "fuelCost" | "demand" | "slotFee" | "serviceCost"
    mult: float


@dataclass
class EventScope:
    kind: str  # "global" | "city" | "route"
    ids: list[str] = field(default_factory=list)


@dataclass
class GameEvent:
    """A static or news-sourced event definition (CONTRACT §2, M3.1).

    V3.1 tri-lingual fields (all optional):
      headline_en / headline_es — English and Latin-American Spanish headlines.
      detail_en / detail_es   — English and Latin-American Spanish details.
    When absent, the frontend falls back to the Chinese ``headline``/``detail``.
    """

    id: str
    source: str  # "static" | "news"
    headline: str
    scope: EventScope
    effects: list[EventEffect]
    duration_turns: int  # [1, 8]
    severity: str  # "minor" | "major"
    detail: str | None = None
    source_url: str | None = None
    # V3.1: optional English / Spanish translations
    headline_en: str | None = None
    headline_es: str | None = None
    detail_en: str | None = None
    detail_es: str | None = None


@dataclass
class ActiveEvent:
    """A GameEvent that is currently in effect (CONTRACT §2, M3.1)."""

    id: str
    source: str
    headline: str
    scope: EventScope
    effects: list[EventEffect]
    duration_turns: int
    severity: str
    detail: str | None = None
    source_url: str | None = None
    started_turn: int = 0
    remaining_turns: int = 0
    # V3.1: optional English / Spanish translations (inherited from GameEvent)
    headline_en: str | None = None
    headline_es: str | None = None
    detail_en: str | None = None
    detail_es: str | None = None


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
    # V3.9: city endowment fields
    iata: str = ""                      # primary airport IATA code (3 uppercase letters)
    airport: str = ""                   # official English airport name
    airport_zh: str = ""                # official Chinese airport name
    population: float = 0.0            # metro population in millions (display only)
    tax_relief: float = 0.0            # HQ overhead reduction factor [0, 0.3]
    transit_index: int = 5             # city transit maturity 1–10; 5 = neutral
    terrain: str = "plain"             # coastal | mountain | island | plain | desert


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
class CabinMix:
    """Floor-space percentages for each cabin class; three fields must sum to 100
    (CONTRACT §2/§3, M2.3). Default {100, 0, 0} = all-economy, backward-compat."""

    economy: int = 100
    business: int = 0
    first: int = 0


@dataclass
class ClassStats:
    """Per-cabin-class quarter stats (CONTRACT §2, M2.3)."""

    pax: int
    capacity: int
    revenue: float


@dataclass
class RouteQuarterStats:
    pax: int
    capacity: int
    load_factor: float
    revenue: float
    cost: float
    profit: float
    # M2.3: per-class breakdown. Defaults to None so existing code that builds
    # RouteQuarterStats without this field still works (e.g. empty-route path).
    classes: dict[str, ClassStats] | None = None


@dataclass
class Route:
    id: str
    city_a: str
    city_b: str
    distance_km: float
    aircraft_ids: list[str] = field(default_factory=list)
    weekly_flights: float = balance.DEFAULT_WEEKLY_FLIGHTS
    fare_mult: float = 1.0
    cabin_mix: CabinMix = field(default_factory=CabinMix)
    service_tier: int = 2  # 1 | 2 | 3 (CONTRACT §3, M2.3)
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
    style: str = "budget"  # V3.10: "aggressive" | "premium" | "budget" | "network"
    style_zh: str | None = None  # V3.10: optional Chinese display name for style
    routes: list[CompetitorRoute] = field(default_factory=list)
    market_share: float = 0.0  # last quarter's share, 0–1


@dataclass
class NewsItem:
    headline: str
    detail: str | None = None
    kind: Literal["system", "event"] = "system"


# --- V3.7 Brand / Marketing / Decision types ------------------------------------


@dataclass
class Marketing:
    """Quarterly marketing spend allocation per channel (each 0–10 = $M/quarter).
    CONTRACT §2 V3.7: digital / sponsor / service."""

    digital: int = 0
    sponsor: int = 0
    service: int = 0


@dataclass
class DecisionOption:
    """One branch of a DecisionEvent (CONTRACT §2 V3.7)."""

    id: str
    label: str
    cash_delta: float       # immediate cash change; negative = outlay
    brand_delta: float      # brand score change
    is_default: bool = False
    label_en: str | None = None
    label_es: str | None = None


@dataclass
class DecisionEvent:
    """An interactive PR/marketing dilemma the player must resolve (CONTRACT §2 V3.7)."""

    id: str
    prompt: str
    options: list[DecisionOption]
    expires_turn: int       # if unresolved at this turn's settlement → auto-resolve
    drawn_turn: int = 0    # set when drawn into pendingDecision
    prompt_en: str | None = None
    prompt_es: str | None = None
    detail: str | None = None
    detail_en: str | None = None
    detail_es: str | None = None


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


# --- M2.4 endgame types -------------------------------------------------------


@dataclass
class Lifetime:
    """Cumulative stats across all settled turns (CONTRACT §2, M2.4).
    Accumulated every settlement; losses included, pax = actual flown."""

    profit: float = 0.0
    pax: int = 0


@dataclass
class StandingEntry:
    """One row in FinalResult.standings (CONTRACT §2, M2.4)."""

    name: str
    is_player: bool
    market_share: float  # final quarter's marketShare


@dataclass
class FinalResult:
    """End-of-game result (CONTRACT §2, M2.4).  Null until turn 80 settles."""

    rank: int  # 1–4; player rank among all 4 competitors
    victory: bool  # rank == 1
    standings: list[StandingEntry]  # ordered by rank (desc marketShare)
    cumulative_profit: float
    cumulative_pax: int
    ended_turn: int  # = GAME_LENGTH_TURNS


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
    status: Literal["active", "bankrupt", "finished"] = "active"
    # M2.4: cumulative lifetime stats (accumulated every settlement).
    lifetime: Lifetime = field(default_factory=Lifetime)
    # M2.4: final result — null until turn 80 settles.
    final_result: FinalResult | None = None
    # M2.2 slot system: slots the player holds per city (used or not), and the
    # turn of the last successful negotiation per city (1-per-city-per-turn
    # cooldown). The API exposes these only through the computed slotMarket
    # snapshot (compute_slot_market), never raw.
    slots_held: dict[str, int] = field(default_factory=dict)
    last_negotiation_turn: dict[str, int] = field(default_factory=dict)
    # M3.1: currently active events (serialized as camelCase via the schema layer).
    active_events: list[ActiveEvent] = field(default_factory=list)
    # M4.3: track news event ids that have been activated in this game.
    # Prevents a game from ever re-drawing the same news event twice.
    seen_news_ids: set[str] = field(default_factory=set)
    # V3.7: brand reputation 0–100 (default 50) and marketing allocation.
    brand: float = field(default_factory=lambda: balance.BRAND_INITIAL)
    marketing: Marketing = field(default_factory=Marketing)
    # V3.7: pending player decision (drawn from decision pool, None when idle).
    pending_decision: DecisionEvent | None = None
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
    if state.status == "finished":
        raise GameOverError("比赛已结束; no further commands or turns accepted")
