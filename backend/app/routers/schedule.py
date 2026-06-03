from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app import schemas
from app.services import geo as geo_service
from app.services import schedule as schedule_service

router = APIRouter(tags=["schedule"])


@router.get("/matches", response_model=list[schemas.Match])
def list_matches(
    city: str | None = Query(None),
    team: str | None = Query(None),
    group: str | None = Query(None),
    stage: str | None = Query(None),
    date: str | None = Query(None),
) -> list[schemas.Match]:
    return schedule_service.list_matches(
        city=city, team=team, group=group, stage=stage, date=date
    )


@router.get("/matches/{match_id}", response_model=schemas.Match)
def get_match(match_id: str) -> schemas.Match:
    match = schedule_service.get_match(match_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.get("/cities", response_model=list[schemas.City])
def list_cities() -> list[schemas.City]:
    return schedule_service.list_cities()


@router.get("/cities/{city_id}", response_model=schemas.City)
def get_city(city_id: str) -> schemas.City:
    city = schedule_service.get_city(city_id)
    if city is None:
        raise HTTPException(status_code=404, detail="City not found")
    return city


@router.get("/cities/{city_id}/nearby", response_model=list[schemas.NearbyCity])
def nearby_cities(
    city_id: str, limit: int = Query(3, ge=1, le=15)
) -> list[schemas.NearbyCity]:
    if schedule_service.get_city(city_id) is None:
        raise HTTPException(status_code=404, detail="City not found")
    return geo_service.nearby_cities(city_id, limit)


@router.get("/teams", response_model=list[schemas.Team])
def list_teams() -> list[schemas.Team]:
    return schedule_service.list_teams()
