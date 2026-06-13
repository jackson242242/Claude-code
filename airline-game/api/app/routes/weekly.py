"""V3.4 Weekly Challenge & Leaderboard routes (CONTRACT.md §1)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app import schemas
from app.deps import get_service
from app.engine.state import GameState, World, compute_slot_market
from app.leaderboard_store import get_leaderboard_store
from app.service import GameService
from app.weekly import current_week_id, week_ends_at_ms, weekly_hq

router = APIRouter(prefix="/api", tags=["weekly"])


def _serialize_state(state: GameState, world: World) -> schemas.GameState:
    """Engine state → wire schema (reuses the games-router helper logic)."""
    payload = schemas.GameState.model_validate(state)
    payload.slot_market = {
        city_id: schemas.CitySlotInfo.model_validate(info)
        for city_id, info in compute_slot_market(state, world).items()
    }
    return payload


@router.get("/weekly", response_model=schemas.WeeklyChallenge)
def get_weekly(service: GameService = Depends(get_service)) -> schemas.WeeklyChallenge:
    """GET /api/weekly — return this week's challenge parameters."""
    week_id = current_week_id()
    return schemas.WeeklyChallenge(
        week_id=week_id,
        hq_city_id=weekly_hq(week_id),
        ends_at_ms=week_ends_at_ms(week_id),
    )


@router.post("/weekly/games", response_model=schemas.GameState, status_code=201)
def create_weekly_game(
    body: schemas.CreateWeeklyGameRequest,
    service: GameService = Depends(get_service),
) -> schemas.GameState:
    """POST /api/weekly/games — create a weekly challenge game.

    HQ is fixed to the week's deterministic city; seed = weekId so all
    participants share the same event/decision draw sequence.
    """
    week_id = current_week_id()
    hq_city_id = weekly_hq(week_id)
    state = service.create_weekly_game(body.airline_name, week_id, hq_city_id)
    return _serialize_state(state, service.world)


@router.get("/leaderboard", response_model=schemas.LeaderboardResponse)
def get_leaderboard(
    week_id: str | None = Query(default=None, alias="weekId"),
    token: str | None = Query(default=None),
) -> schemas.LeaderboardResponse:
    """GET /api/leaderboard?weekId=...&token=... — top-50 weekly leaderboard.

    weekId defaults to the current ISO week.
    token (optional): when provided, the matching row gets isYou=True.
    """
    resolved_week_id = week_id or current_week_id()
    store = get_leaderboard_store()
    rows = store.top(resolved_week_id, limit=50)

    entries: list[schemas.LeaderboardEntry] = []
    for rank, row in enumerate(rows, start=1):
        entries.append(
            schemas.LeaderboardEntry(
                rank=rank,
                name=row["name"],
                score=row["score"],
                profit=row["profit"],
                market_share=row["share"],
                is_you=(token is not None and row["player_token"] == token),
            )
        )

    return schemas.LeaderboardResponse(
        week_id=resolved_week_id,
        entries=entries,
    )
