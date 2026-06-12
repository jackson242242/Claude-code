"""Thin REST layer over the engine + service (CONTRACT.md §1)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app import schemas
from app.deps import get_service
from app.service import GameService

router = APIRouter(prefix="/api", tags=["games"])


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
    return schemas.GameState.model_validate(state)


@router.get("/games/{game_id}", response_model=schemas.GameState)
def get_game(
    game_id: str, service: GameService = Depends(get_service)
) -> schemas.GameState:
    return schemas.GameState.model_validate(service.get_game(game_id))


@router.post("/games/{game_id}/commands", response_model=schemas.CommandsResponse)
def post_commands(
    game_id: str,
    body: schemas.CommandsRequest,
    service: GameService = Depends(get_service),
) -> schemas.CommandsResponse:
    state, results = service.apply_commands(game_id, body.commands)
    return schemas.CommandsResponse(
        state=schemas.GameState.model_validate(state),
        results=[schemas.CommandResult.model_validate(r) for r in results],
    )


@router.post("/games/{game_id}/end-turn", response_model=schemas.EndTurnResponse)
def end_turn(
    game_id: str, service: GameService = Depends(get_service)
) -> schemas.EndTurnResponse:
    state, report = service.end_turn(game_id)
    return schemas.EndTurnResponse(
        state=schemas.GameState.model_validate(state),
        report=schemas.TurnReport.model_validate(report),
    )
