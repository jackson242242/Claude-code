"""Thin REST layer over the engine + service (CONTRACT.md §1)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app import schemas
from app.deps import get_service
from app.engine.state import GameState, World, compute_slot_market
from app.service import GameService

router = APIRouter(prefix="/api", tags=["games"])


def serialize_state(state: GameState, world: World) -> schemas.GameState:
    """Engine state → wire schema, with the M2.2 slotMarket snapshot recomputed
    on every response (CONTRACT §3); the computation itself is the pure
    engine function ``compute_slot_market``."""
    payload = schemas.GameState.model_validate(state)
    payload.slot_market = {
        city_id: schemas.CitySlotInfo.model_validate(info)
        for city_id, info in compute_slot_market(state, world).items()
    }
    return payload


@router.get("/meta", response_model=schemas.MetaResponse)
def get_meta(service: GameService = Depends(get_service)) -> schemas.MetaResponse:
    return schemas.MetaResponse(
        cities=[schemas.City.model_validate(c) for c in service.world.cities.values()],
        aircraft_models=[
            schemas.AircraftModel.model_validate(m)
            for m in service.world.aircraft_models.values()
        ],
    )


@router.post("/games", response_model=schemas.GameState, status_code=201)
def create_game(
    body: schemas.CreateGameRequest, service: GameService = Depends(get_service)
) -> schemas.GameState:
    state = service.create_game(body.airline_name, body.hq_city_id)
    return serialize_state(state, service.world)


@router.get("/games/{game_id}", response_model=schemas.GameState)
def get_game(
    game_id: str, service: GameService = Depends(get_service)
) -> schemas.GameState:
    return serialize_state(service.get_game(game_id), service.world)


@router.post("/games/{game_id}/commands", response_model=schemas.CommandsResponse)
def post_commands(
    game_id: str,
    body: schemas.CommandsRequest,
    service: GameService = Depends(get_service),
) -> schemas.CommandsResponse:
    state, results = service.apply_commands(game_id, body.commands)
    return schemas.CommandsResponse(
        state=serialize_state(state, service.world),
        results=[schemas.CommandResult.model_validate(r) for r in results],
    )


@router.post("/games/{game_id}/end-turn", response_model=schemas.EndTurnResponse)
def end_turn(
    game_id: str, service: GameService = Depends(get_service)
) -> schemas.EndTurnResponse:
    state, report = service.end_turn(game_id)
    return schemas.EndTurnResponse(
        state=serialize_state(state, service.world),
        report=schemas.TurnReport.model_validate(report),
    )
