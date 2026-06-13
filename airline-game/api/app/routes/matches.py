"""V3.3 Multiplayer match endpoints (CONTRACT §1).

6 endpoints:
  POST   /api/matches                   — create room + become host
  POST   /api/matches/{code}/join       — join lobby (not full, not started)
  POST   /api/matches/{code}/start      — host starts the game (≥2 players)
  GET    /api/matches/{code}            — poll for state (?playerId=...)
  POST   /api/matches/{code}/commands   — submit commands for your airline
  POST   /api/matches/{code}/ready      — mark yourself ready (triggers settle if all ready)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app import schemas
from app.deps import get_service
from app.engine.match import Match, MatchError
from app.engine.state import Competitor, CompetitorRoute, GameState, World, compute_slot_market
from app.match_service import MatchNotFoundError, MatchService
from app.service import GameService

router = APIRouter(prefix="/api/matches", tags=["matches"])


# ---------------------------------------------------------------------------
# Dependency: get (or lazily create) the MatchService singleton
# ---------------------------------------------------------------------------

_match_service: MatchService | None = None


def get_match_service(game_service: GameService = Depends(get_service)) -> MatchService:
    global _match_service
    if _match_service is None:
        _match_service = MatchService(
            world=game_service.world,
            event_pool=game_service._event_pool,
            decision_pool=game_service._decision_pool,
        )
    return _match_service


# ---------------------------------------------------------------------------
# MatchView serializer
# ---------------------------------------------------------------------------


def _build_you(
    player_state: GameState,
    match: Match,
    world: World,
) -> schemas.GameState:
    """Build the 'you' GameState for a MatchView.

    competitors field = AI competitors + other human players mapped to Competitor
    entries (id/name/nameZh/hqCityId/fareMult/style/routes/marketShare).
    """
    # Gather AI competitors from the match level
    all_competitors: list[schemas.Competitor] = []

    for ai in match.competitors:
        all_competitors.append(schemas.Competitor.model_validate(ai))

    # Add other human players as Competitor entries
    for other in match.players:
        if other.player_id == player_state.id:
            continue  # skip self
        if other.state is None:
            continue
        # Build CompetitorRoute entries from other player's routes
        other_routes = [
            schemas.CompetitorRoute(
                city_a=rt.city_a,
                city_b=rt.city_b,
                weekly_seats=int(
                    sum(
                        world.aircraft_models[ac.model_id].seats
                        for ac in other.state.fleet
                        if ac.route_id == rt.id and ac.model_id in world.aircraft_models
                    ) * rt.weekly_flights
                ) if other.state.fleet else 0,
            )
            for rt in other.state.routes
        ]
        other_competitor = schemas.Competitor(
            id=other.player_id,
            name=other.name,
            name_zh=other.name,
            hq_city_id=other.hq_city_id,
            fare_mult=1.0,  # neutral default for human players
            style="network",  # neutral style for human display
            style_zh=None,
            routes=other_routes,
            market_share=other.market_share,
        )
        all_competitors.append(other_competitor)

    # Build the wire GameState from the player's engine state
    payload = schemas.GameState.model_validate(player_state)
    payload.competitors = all_competitors
    # Recompute slot market (the engine compute_slot_market looks at competitors
    # on state.competitors — we need to pass the real engine state with empty
    # competitors, but the slot computation only uses AI routes for 'taken' count)
    # We compute it using the ACTUAL per-player state (which has empty competitors)
    # and then manually add AI competitor route slot occupancy.
    from app.engine.state import CitySlotInfo
    slot_market: dict[str, schemas.CitySlotInfo] = {}
    for city in world.cities.values():
        # AI taken slots
        ai_taken = sum(
            1
            for ai in match.competitors
            for rt in ai.routes
            if city.id in (rt.city_a, rt.city_b)
        )
        player_held = player_state.slots_held.get(city.id, 0)
        player_used = sum(
            1 for rt in player_state.routes if city.id in (rt.city_a, rt.city_b)
        )
        taken = ai_taken + player_held
        slot_market[city.id] = schemas.CitySlotInfo(
            capacity=city.slot_capacity,
            taken=taken,
            player_held=player_held,
            player_used=player_used,
        )
    payload.slot_market = slot_market
    return payload


def serialize_match_view(
    match: Match,
    player_id: str,
    world: World,
) -> schemas.MatchView:
    """Build a MatchView for a given playerId."""
    # Find the requesting player
    player = next((p for p in match.players if p.player_id == player_id), None)
    if player is None:
        raise MatchError(f"player not found in match: {player_id}")

    players_lite = [
        schemas.MatchPlayerLite(
            player_id=p.player_id,
            name=p.name,
            hq_city_id=p.hq_city_id,
            ready=p.ready,
            market_share=p.market_share,
            bankrupt=p.bankrupt,
        )
        for p in match.players
    ]

    you = _build_you(player.state, match, world)

    last_report: schemas.TurnReport | None = None
    if player_id in match.last_reports:
        last_report = schemas.TurnReport.model_validate(match.last_reports[player_id])

    final_standings = None
    if match.final_standings is not None:
        final_standings = [
            schemas.StandingEntry.model_validate(s) for s in match.final_standings
        ]

    # quarter must be a valid Literal[1,2,3,4] — it always is since the engine
    # only stores 1–4, but we cast to int just in case.
    return schemas.MatchView(
        code=match.code,
        phase=match.phase,
        turn=match.turn,
        year=match.year,
        quarter=match.quarter,  # type: ignore[arg-type]
        max_players=match.max_players,
        players=players_lite,
        you=you,
        turn_deadline_ms=match.turn_deadline_ms,
        last_report=last_report,
        final_standings=final_standings,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("", response_model=schemas.CreateMatchResponse, status_code=201)
def create_match(
    body: schemas.CreateMatchRequest,
    service: MatchService = Depends(get_match_service),
) -> schemas.CreateMatchResponse:
    code, player_id = service.create_match(
        host_name=body.host_name,
        host_hq_city_id=body.host_hq_city_id,
        max_players=body.max_players,
        fill_with_ai=body.fill_with_ai,
    )
    return schemas.CreateMatchResponse(code=code, player_id=player_id)


@router.post("/{code}/join", response_model=schemas.JoinMatchResponse)
def join_match(
    code: str,
    body: schemas.JoinMatchRequest,
    service: MatchService = Depends(get_match_service),
) -> schemas.JoinMatchResponse:
    player_id = service.join_match(code.upper(), body.name, body.hq_city_id)
    return schemas.JoinMatchResponse(player_id=player_id)


@router.post("/{code}/start", response_model=schemas.MatchView)
def start_match(
    code: str,
    body: schemas.StartMatchRequest,
    service: MatchService = Depends(get_match_service),
) -> schemas.MatchView:
    match = service.start_match(code.upper(), body.player_id)
    return serialize_match_view(match, body.player_id, service.world)


@router.get("/{code}", response_model=schemas.MatchView)
def get_match(
    code: str,
    player_id: str = Query(..., alias="playerId"),
    service: MatchService = Depends(get_match_service),
) -> schemas.MatchView:
    match = service.get_match(code.upper(), player_id)
    return serialize_match_view(match, player_id, service.world)


@router.post("/{code}/commands", response_model=schemas.MatchCommandsResponse)
def match_commands(
    code: str,
    body: schemas.MatchCommandsRequest,
    service: MatchService = Depends(get_match_service),
) -> schemas.MatchCommandsResponse:
    match, results = service.apply_commands(code.upper(), body.player_id, body.commands)
    return schemas.MatchCommandsResponse(
        view=serialize_match_view(match, body.player_id, service.world),
        results=[schemas.CommandResult.model_validate(r) for r in results],
    )


@router.post("/{code}/ready", response_model=schemas.MatchView)
def match_ready(
    code: str,
    body: schemas.MatchReadyRequest,
    service: MatchService = Depends(get_match_service),
) -> schemas.MatchView:
    match = service.mark_ready(code.upper(), body.player_id)
    return serialize_match_view(match, body.player_id, service.world)
