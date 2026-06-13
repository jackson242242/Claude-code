"""Pure match engine for V3.3 multiplayer room-based battles.

A Match holds:
  - Shared world references (AI competitors, events, decisions, seen_ids)
  - Shared AI/event/turn state at match level
  - Per-player GameState objects (each player's airline — fleet/routes/cash/brand/etc)
    with competitors left EMPTY on the per-player object (opponents live at match level)

Pure functions — no FastAPI, no I/O, no storage.
"""
from __future__ import annotations

import math
import random
import string
import time
from dataclasses import dataclass, field
from typing import Literal

from app.engine import balance
from app.engine.competitors import (
    competitor_route_capacity,
    effective_fare_mult,
    evolve_competitors,
    get_competitor_weight_bonus,
    initial_competitors,
)
from app.engine.decisions import auto_resolve_decision, draw_decision
from app.engine.events import get_cost_mult, get_demand_mult, process_events
from app.engine.simulate import (
    MarketAllocation,
    RouteTurnStats,
    TurnReport,
    _Seller,
    allocate_city_pair,
    assigned_models,
    block_hours_per_flight,
    cabin_seats,
    fare_usd,
    fleet_holding_cost,
    market_pax,
    overhead_cost,
    price_weight,
    route_capacity,
    simulate_route,
    update_market_shares,
)
from app.engine.state import (
    ActiveEvent,
    City,
    ClassStats,
    Competitor,
    CompetitorRoute,
    FinanceHistoryEntry,
    FinanceTotals,
    FinalResult,
    FleetAircraft,
    GameState,
    Marketing,
    NewsItem,
    Route,
    RouteQuarterStats,
    StandingEntry,
    World,
    ensure_active,
    get_aircraft,
    haversine_km,
    new_game,
    player_slots_used,
)

# Turn deadline (180 seconds from when the turn becomes active).
TURN_DEADLINE_SECONDS = 180


class MatchError(Exception):
    """Raised when a match operation fails (lobby full, already started, etc.)."""


@dataclass
class MatchPlayer:
    """One human player inside a Match."""

    player_id: str
    name: str         # airline name
    hq_city_id: str
    ready: bool = False
    bankrupt: bool = False
    market_share: float = 0.0
    # The player's airline state (competitors field left empty — shared AI lives at match level)
    state: GameState | None = None


@dataclass
class Match:
    """The shared room state for a multiplayer game."""

    code: str
    phase: Literal["lobby", "active", "finished"] = "lobby"
    max_players: int = 4
    fill_with_ai: bool = True

    # Shared world — AI competitors, event pools, seen_ids (shared across all players)
    competitors: list[Competitor] = field(default_factory=list)
    shared_seen_news_ids: set[str] = field(default_factory=set)
    shared_active_events: list[ActiveEvent] = field(default_factory=list)
    shared_negative_cash_quarters: dict[str, int] = field(default_factory=dict)

    # Shared turn/calendar (all players share the same turn counter)
    turn: int = 1
    year: int = balance.START_YEAR
    quarter: int = balance.START_QUARTER

    # Players (in join order; first = host)
    players: list[MatchPlayer] = field(default_factory=list)

    # Turn deadline (epoch ms), set when turn becomes active; None in lobby/finished
    turn_deadline_ms: float | None = None

    # Last settled turn report (per player)
    last_reports: dict[str, TurnReport] = field(default_factory=dict)

    # Endgame
    final_standings: list[StandingEntry] | None = None


def _generate_code(existing_codes: set[str]) -> str:
    """Generate a unique 6-char uppercase alphanumeric code."""
    chars = string.ascii_uppercase + string.digits
    for _ in range(1000):
        code = "".join(random.choices(chars, k=6))
        if code not in existing_codes:
            return code
    raise MatchError("could not generate a unique match code after 1000 tries")


def new_match(code: str, host_name: str, host_hq_city_id: str, max_players: int, fill_with_ai: bool, world: World) -> Match:
    """Create a new match in lobby phase and add the host player."""
    if max_players < 2 or max_players > 4:
        raise MatchError("maxPlayers must be between 2 and 4")
    hq_city = world.cities.get(host_hq_city_id)
    if hq_city is None:
        raise MatchError(f"unknown city: {host_hq_city_id}")

    match = Match(
        code=code,
        max_players=max_players,
        fill_with_ai=fill_with_ai,
        competitors=initial_competitors(),
    )

    # Create host player state
    player_id = f"p-{code}-0"
    state = _make_player_state(player_id, host_name, hq_city, match)
    player = MatchPlayer(
        player_id=player_id,
        name=host_name,
        hq_city_id=host_hq_city_id,
        state=state,
    )
    match.players.append(player)
    return match


def _make_player_state(player_id: str, name: str, hq_city: City, match: Match) -> GameState:
    """Create a fresh per-player GameState for the match. competitors is empty
    because the shared AI lives at the match level."""
    from app.engine.state import Lifetime, Finance
    state = GameState(
        id=player_id,
        airline_name=name,
        hq_city_id=hq_city.id,
        turn=match.turn,
        year=match.year,
        quarter=match.quarter,
        cash=balance.STARTING_CASH,
        competitors=[],  # intentionally empty — AI lives at match level
        slots_held={hq_city.id: balance.HQ_STARTING_SLOTS},
        news=[
            NewsItem(
                headline=f"{name} 正式成立",
                detail=f"总部设于{hq_city.name_zh}（{hq_city.name}），启动资金 $420M。",
                kind="system",
            )
        ],
    )
    return state


def add_player(match: Match, name: str, hq_city_id: str, world: World) -> str:
    """Add a player to a lobby. Returns the new player_id."""
    if match.phase != "lobby":
        raise MatchError("match has already started")
    human_count = len(match.players)
    if human_count >= match.max_players:
        raise MatchError("match is full")

    hq_city = world.cities.get(hq_city_id)
    if hq_city is None:
        raise MatchError(f"unknown city: {hq_city_id}")

    player_id = f"p-{match.code}-{human_count}"
    state = _make_player_state(player_id, name, hq_city, match)
    player = MatchPlayer(
        player_id=player_id,
        name=name,
        hq_city_id=hq_city_id,
        state=state,
    )
    match.players.append(player)
    return player_id


def start_match(match: Match, player_id: str) -> None:
    """Transition from lobby → active. Only the host (first player) may call this."""
    if match.phase != "lobby":
        raise MatchError("match has already started")
    if match.players[0].player_id != player_id:
        raise MatchError("only the host can start the match")
    if len(match.players) < 2:
        raise MatchError("at least 2 players are required to start")

    match.phase = "active"
    match.turn_deadline_ms = (time.time() + TURN_DEADLINE_SECONDS) * 1000


def _get_player(match: Match, player_id: str) -> MatchPlayer:
    for p in match.players:
        if p.player_id == player_id:
            return p
    raise MatchError(f"player not found: {player_id}")


def apply_player_commands(match: Match, player_id: str, commands: list[dict], world: World) -> list:
    """Apply commands to a player's GameState using the existing pure commands.py."""
    if match.phase == "lobby":
        raise MatchError("match has not started yet")
    if match.phase == "finished":
        raise MatchError("match is finished")

    player = _get_player(match, player_id)
    if player.bankrupt:
        raise MatchError("your airline is bankrupt")

    # Temporarily set the player state's turn/year/quarter to match shared values
    # so command validators see the correct turn number (for negotiation cooldown etc)
    player.state.turn = match.turn
    player.state.year = match.year
    player.state.quarter = match.quarter

    from app.engine.commands import apply_commands
    results = apply_commands(player.state, world, commands)
    return results


def _check_deadline(match: Match) -> bool:
    """Returns True if the turn deadline has passed (lazy trigger)."""
    if match.turn_deadline_ms is None:
        return False
    return time.time() * 1000 >= match.turn_deadline_ms


def mark_ready(match: Match, player_id: str) -> bool:
    """Mark a player as ready for the current turn.
    Returns True if settlement should happen (all non-bankrupt ready, or deadline passed)."""
    if match.phase != "active":
        raise MatchError("match is not in active phase")

    player = _get_player(match, player_id)
    if player.bankrupt:
        raise MatchError("bankrupt players cannot mark ready")
    player.ready = True

    return _should_settle(match)


def _should_settle(match: Match) -> bool:
    """Return True when all non-bankrupt players are ready, or deadline passed."""
    active_players = [p for p in match.players if not p.bankrupt]
    if not active_players:
        return True
    all_ready = all(p.ready for p in active_players)
    if all_ready:
        return True
    if _check_deadline(match):
        return True
    return False


def _build_match_allocation(match: Match, world: World) -> dict[str, MarketAllocation]:
    """Run shared market allocation across ALL sellers: every player's routes + AI routes.

    Returns a per-player allocation dict (routeId → pax for each player's routes).
    This is the heart of settle_match: all sellers compete in the SAME market.
    """
    active_events = match.shared_active_events
    quarter = match.quarter

    # Collect all city pairs served by any player or any AI
    # Map: frozenset(cityA, cityB) → list of sellers
    pair_sellers: dict[frozenset, list] = {}  # pair → list of (kind, ref)
    pair_order: list[frozenset] = []

    # Add player route pairs
    for player in match.players:
        if player.bankrupt or player.state is None:
            continue
        for route in player.state.routes:
            pair = frozenset((route.city_a, route.city_b))
            if pair not in pair_sellers:
                pair_sellers[pair] = []
                pair_order.append(pair)
            pair_sellers[pair].append(("player", player.player_id, route))

    # Add AI route pairs
    for competitor in match.competitors:
        ai_fare = effective_fare_mult(competitor)
        ai_bonus = get_competitor_weight_bonus(competitor)
        for ai_route in competitor.routes:
            pair = frozenset((ai_route.city_a, ai_route.city_b))
            if pair not in pair_sellers:
                pair_sellers[pair] = []
                pair_order.append(pair)
            pair_sellers[pair].append(("ai", competitor.id, ai_route, ai_fare, ai_bonus))

    # Initialize per-player allocations
    player_allocations: dict[str, MarketAllocation] = {
        p.player_id: MarketAllocation() for p in match.players if not p.bankrupt and p.state
    }
    ai_pax_totals: dict[str, float] = {c.id: 0.0 for c in match.competitors}
    background_pax_total = 0.0

    for pair in pair_order:
        city_ids = list(pair)
        city_a_obj = world.cities[city_ids[0]]
        city_b_obj = world.cities[city_ids[1]]

        # Compute distance (use route.distance_km if available, else haversine)
        distance = None
        for entry in pair_sellers.get(pair, []):
            if entry[0] == "player":
                distance = entry[2].distance_km
                break
        if distance is None:
            distance = round(haversine_km(city_a_obj.lat, city_a_obj.lon, city_b_obj.lat, city_b_obj.lon), 1)

        base_market = market_pax(
            city_a_obj.demand_index,
            city_b_obj.demand_index,
            quarter,
            distance,
            transit_a=city_a_obj.transit_index,
            transit_b=city_b_obj.transit_index,
        )
        demand_mult = get_demand_mult(active_events, city_a_obj.id, city_b_obj.id)
        total_market = base_market * demand_mult

        # Build sellers list; track which seller → (type, id, route_id)
        sellers: list[_Seller] = []
        seller_meta: list[tuple] = []  # (kind, player_id_or_ai_id, route_id_or_ai_id)

        for entry in pair_sellers.get(pair, []):
            if entry[0] == "player":
                _, pid, route = entry
                player = next(p for p in match.players if p.player_id == pid)
                state = player.state
                w = price_weight(
                    route.fare_mult,
                    route.service_tier,
                    brand=state.brand,
                    marketing_digital=state.marketing.digital,
                    marketing_sponsor=state.marketing.sponsor,
                )
                cap = route_capacity(state, world, route)
                sellers.append(_Seller(weight=w, capacity=cap))
                seller_meta.append(("player", pid, route.id))
            elif entry[0] == "ai":
                _, ai_id, ai_route, ai_fare, ai_bonus = entry
                cap = competitor_route_capacity(ai_route)
                w = price_weight(ai_fare) * ai_bonus
                sellers.append(_Seller(weight=w, capacity=cap))
                seller_meta.append(("ai", ai_id, None))

        # Add background market seller
        from app.engine.simulate import _Seller as Seller
        import math as _math
        background = _Seller(weight=balance.W_BG, capacity=_math.inf)
        sellers.append(background)
        seller_meta.append(("bg", None, None))

        allocate_city_pair(total_market, sellers)

        # Distribute results
        for i, (meta, seller) in enumerate(zip(seller_meta, sellers)):
            kind = meta[0]
            if kind == "player":
                pid = meta[1]
                route_id = meta[2]
                if pid in player_allocations:
                    player_allocations[pid].route_pax[route_id] = int(round(seller.pax))
            elif kind == "ai":
                ai_id = meta[1]
                ai_pax_totals[ai_id] = ai_pax_totals.get(ai_id, 0.0) + seller.pax
            elif kind == "bg":
                background_pax_total += seller.pax

    return player_allocations, ai_pax_totals, background_pax_total


def settle_match(
    match: Match,
    world: World,
    event_pool: list | None = None,
    news_pool_events: list | None = None,
    decision_pool: list | None = None,
) -> dict[str, TurnReport]:
    """Settle the current turn for all players. Mutates match state.

    - Gather ALL sellers (every player's routes + AI routes) into shared allocation
    - Run the EXISTING allocate_city_pair across combined seller set
    - Settle each player's finances independently with simulate_route
    - Run AI evolution + events + decisions ONCE on the shared world
    - Advance calendar
    - If GAME_LENGTH_TURNS: set phase=finished + finalStandings
    Returns: dict of player_id → TurnReport
    """
    if match.phase != "active":
        raise MatchError("match is not in active phase")

    turn = match.turn
    year = match.year
    quarter = match.quarter

    # === Step 1: Auto-resolve expired decisions per player (before settlement) ===
    for player in match.players:
        if player.bankrupt or player.state is None:
            continue
        state = player.state
        if (
            state.pending_decision is not None
            and turn >= state.pending_decision.expires_turn
        ):
            auto_resolve_decision(state)

    # === Step 2: Process shared events ONCE (decrement, expire, draw new) ===
    # We need a temporary GameState-like object to pass to process_events.
    # We use the shared match state by building a proxy.
    # process_events reads: state.active_events, state.seen_news_ids, state.turn
    # and mutates: state.active_events, state.seen_news_ids, state.news (we discard)
    _shared_proxy = _SharedEventProxy(match)
    event_news = process_events(_shared_proxy, turn, event_pool, news_pool_events)
    # Sync back
    match.shared_active_events = _shared_proxy.active_events
    match.shared_seen_news_ids = _shared_proxy.seen_news_ids

    # === Step 3: AI evolution runs ONCE on the shared world ===
    # evolve_competitors reads state.competitors, state.routes (for network style),
    # and state.turn. We provide a proxy with shared competitors + an empty routes list
    # (no single player's routes should bias the network style choice uniquely;
    # we instead pass all served cities via _all_served_cities which uses state.routes
    # and state.competitors — so we include ALL player routes)
    _ai_proxy = _AIEvolutionProxy(match)
    ai_news = evolve_competitors(_ai_proxy, world)

    # === Step 4: Run shared market allocation (ALL players + AI) ===
    player_allocations, ai_pax_totals, background_pax_total = _build_match_allocation(match, world)

    # Compute total market pax (sum across all pairs)
    total_market_pax = sum(
        sum(alloc.route_pax.values()) for alloc in player_allocations.values()
    ) + sum(ai_pax_totals.values()) + background_pax_total

    # === Step 5: Per-player financial settlement ===
    reports: dict[str, TurnReport] = {}
    for player in match.players:
        if player.bankrupt or player.state is None:
            continue

        state = player.state
        allocation = player_allocations.get(player.player_id, MarketAllocation())

        # Compute player market share
        player_pax = sum(allocation.route_pax.values())
        if total_market_pax > 0:
            player.market_share = round(player_pax / total_market_pax, 4)
            state.market_share = player.market_share
        else:
            player.market_share = 0.0
            state.market_share = 0.0

        # Simulate each route
        route_stats: list[RouteTurnStats] = []
        routes_revenue = 0.0
        routes_cost = 0.0
        for route in state.routes:
            pax = allocation.route_pax.get(route.id, 0)
            stats = simulate_route(
                state, world, route, quarter, pax, match.shared_active_events
            )
            route.last_quarter = stats
            route_stats.append(RouteTurnStats(**vars(stats), route_id=route.id))
            routes_revenue += stats.revenue
            routes_cost += stats.cost

        # Marketing cost
        marketing_cost = (
            (state.marketing.digital + state.marketing.sponsor + state.marketing.service)
            * balance.MARKETING_COST_PER_UNIT
        )

        revenue = round(routes_revenue, 2)
        cost = round(
            routes_cost
            + fleet_holding_cost(state, world)
            + overhead_cost(state, world)
            + marketing_cost,
            2,
        )
        profit = round(revenue - cost, 2)
        totals = FinanceTotals(revenue=revenue, cost=cost, profit=profit)

        state.cash = round(state.cash + profit, 2)
        state.finance.last_quarter = totals
        state.finance.history.append(
            FinanceHistoryEntry(turn=turn, cash=state.cash, profit=profit)
        )

        # Lifetime stats
        total_route_pax = sum(s.pax for s in route_stats)
        state.lifetime.profit = round(state.lifetime.profit + profit, 2)
        state.lifetime.pax += total_route_pax

        # Brand updates (V3.7)
        state.brand += balance.BRAND_SERVICE_DRIP_PER_SERVICE_UNIT * state.marketing.service
        tier_drip = 0.0
        for route in state.routes:
            if route.service_tier == 3:
                tier_drip += balance.BRAND_TIER3_PER_ROUTE
            elif route.service_tier == 1:
                tier_drip += balance.BRAND_TIER1_PER_ROUTE
        tier_drip = max(-balance.BRAND_TIER_CAP, min(balance.BRAND_TIER_CAP, tier_drip))
        state.brand += tier_drip
        state.brand += (balance.BRAND_INITIAL - state.brand) * balance.BRAND_MEAN_REVERSION
        state.brand = round(max(balance.BRAND_MIN, min(balance.BRAND_MAX, state.brand)), 4)

        # Draw decision event (V3.7)
        if state.pending_decision is None and decision_pool is not None:
            drawn = draw_decision(state.id, turn, decision_pool)
            if drawn is not None:
                state.pending_decision = drawn

        # Build news
        news_items: list[NewsItem] = [
            *event_news,
            NewsItem(
                headline=f"{year} 年 Q{quarter} 结算完成",
                detail=(
                    f"营收 ${revenue:,.0f}，成本 ${cost:,.0f}，"
                    f"利润 ${profit:,.0f}，现金 ${state.cash:,.2f}。"
                ),
                kind="system",
            ),
            *ai_news,
        ]

        # Bankruptcy check
        if state.cash < 0:
            neg_qs = match.shared_negative_cash_quarters.get(player.player_id, 0) + 1
            match.shared_negative_cash_quarters[player.player_id] = neg_qs
            if neg_qs >= balance.BANKRUPTCY_CONSECUTIVE_QUARTERS:
                state.status = "bankrupt"
                player.bankrupt = True
                news_items.append(
                    NewsItem(
                        headline=f"{state.airline_name} 宣告破产",
                        detail="现金连续两个季度为负，公司进入清算程序。",
                        kind="system",
                    )
                )
            else:
                news_items.append(
                    NewsItem(
                        headline="财务警报：现金为负",
                        detail="若下季度结束时现金仍为负，公司将破产。",
                        kind="system",
                    )
                )
        else:
            match.shared_negative_cash_quarters[player.player_id] = 0

        state.news = news_items

        reports[player.player_id] = TurnReport(
            turn=turn,
            year=year,
            quarter=quarter,
            route_stats=route_stats,
            totals=totals,
            news=news_items,
        )

    # === Step 6: Update AI market shares ===
    for competitor in match.competitors:
        pax = ai_pax_totals.get(competitor.id, 0.0)
        competitor.market_share = round(pax / total_market_pax, 4) if total_market_pax > 0 else 0.0

    # === Step 7: Check endgame ===
    if turn >= balance.GAME_LENGTH_TURNS:
        match.phase = "finished"
        match.turn_deadline_ms = None
        match.final_standings = _build_match_standings(match)
        # Mark all player states as finished
        for player in match.players:
            if player.state and player.state.status == "active":
                player.state.status = "finished"
    else:
        # Reset ready flags and advance deadline
        for player in match.players:
            player.ready = False
        match.turn_deadline_ms = (time.time() + TURN_DEADLINE_SECONDS) * 1000

    # === Step 8: Advance calendar ===
    match.turn += 1
    if quarter == 4:
        match.year += 1
        match.quarter = 1
    else:
        match.quarter = quarter + 1

    # Sync each player state's turn/year/quarter
    for player in match.players:
        if player.state:
            player.state.turn = match.turn
            player.state.year = match.year
            player.state.quarter = match.quarter

    match.last_reports = reports
    return reports


def _build_match_standings(match: Match) -> list[StandingEntry]:
    """Build final standings ranking all players + AI by market share."""
    entries: list[tuple] = []
    for i, player in enumerate(match.players):
        entries.append((player.market_share, True, i, player.name))
    for j, competitor in enumerate(match.competitors):
        entries.append((competitor.market_share, False, len(match.players) + j, competitor.name))
    entries.sort(key=lambda e: (-e[0], e[2]))
    return [
        StandingEntry(name=name, is_player=is_player, market_share=ms)
        for ms, is_player, _, name in entries
    ]


def maybe_auto_settle(
    match: Match,
    world: World,
    event_pool: list | None = None,
    news_pool_events: list | None = None,
    decision_pool: list | None = None,
) -> dict[str, TurnReport] | None:
    """Check if settlement should happen (deadline passed) and settle if so.
    Returns the reports dict if settled, None otherwise."""
    if match.phase != "active":
        return None
    if _should_settle(match):
        return settle_match(match, world, event_pool, news_pool_events, decision_pool)
    return None


class _SharedEventProxy:
    """Minimal GameState-like proxy for process_events using shared match state."""

    def __init__(self, match: Match) -> None:
        self.active_events: list[ActiveEvent] = list(match.shared_active_events)
        self.seen_news_ids: set[str] = set(match.shared_seen_news_ids)
        # Provide a match-level id (used as seed)
        self.id: str = match.code
        self.turn: int = match.turn
        self.news: list[NewsItem] = []  # we discard this
        # V3.4: seed is the match code (matches don't have weekly challenge seeds)
        self.seed: str = match.code


class _AIEvolutionProxy:
    """Minimal GameState-like proxy for evolve_competitors with all routes visible.

    pool_slots_taken (called by _next_destination) reads:
      state.competitors[*].routes    → for AI slot occupancy
      state.slots_held               → for player-held slots (combined for all players)
    We combine all player slots_held so the AI doesn't double-count across players.
    """

    def __init__(self, match: Match) -> None:
        self.competitors: list[Competitor] = match.competitors
        self.turn: int = match.turn
        # Include all player routes so network style prefers contested cities
        self.routes: list[Route] = []
        # Combine all players' slots_held for pool occupancy checks
        combined_slots: dict[str, int] = {}
        for player in match.players:
            if player.state:
                self.routes.extend(player.state.routes)
                for city_id, count in player.state.slots_held.items():
                    combined_slots[city_id] = combined_slots.get(city_id, 0) + count
        self.slots_held: dict[str, int] = combined_slots
