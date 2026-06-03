from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException

from app import schemas
from app.services import trips as trips_service

router = APIRouter(tags=["trips"])


def current_user_id(x_user_id: str | None = Header(default=None)) -> str:
    """Lightweight identity: the client supplies an opaque user id header."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    return x_user_id


@router.get("/me", response_model=schemas.User)
def get_me(user_id: str = Depends(current_user_id)) -> schemas.User:
    return trips_service.get_or_create_user(user_id)


@router.get("/trips", response_model=list[schemas.TripSummary])
def list_trips(user_id: str = Depends(current_user_id)) -> list[schemas.TripSummary]:
    return trips_service.list_trips(user_id)


@router.post("/trips", response_model=schemas.Trip, status_code=201)
def create_trip(
    body: schemas.CreateTripRequest, user_id: str = Depends(current_user_id)
) -> schemas.Trip:
    return trips_service.create_trip(user_id, body.name)


@router.get("/trips/{trip_id}", response_model=schemas.Trip)
def get_trip(trip_id: str, user_id: str = Depends(current_user_id)) -> schemas.Trip:
    return trips_service.get_trip(user_id, trip_id)


@router.patch("/trips/{trip_id}", response_model=schemas.Trip)
def rename_trip(
    trip_id: str,
    body: schemas.RenameTripRequest,
    user_id: str = Depends(current_user_id),
) -> schemas.Trip:
    return trips_service.rename_trip(user_id, trip_id, body.name)


@router.delete("/trips/{trip_id}")
def delete_trip(
    trip_id: str, user_id: str = Depends(current_user_id)
) -> dict[str, bool]:
    trips_service.delete_trip(user_id, trip_id)
    return {"ok": True}


@router.post("/trips/{trip_id}/items", response_model=schemas.Trip, status_code=201)
def add_item(
    trip_id: str,
    body: schemas.AddTripItemRequest,
    user_id: str = Depends(current_user_id),
) -> schemas.Trip:
    return trips_service.add_item(user_id, trip_id, body)


@router.delete("/trips/{trip_id}/items/{item_id}", response_model=schemas.Trip)
def remove_item(
    trip_id: str, item_id: str, user_id: str = Depends(current_user_id)
) -> schemas.Trip:
    return trips_service.remove_item(user_id, trip_id, item_id)


@router.get("/trips/{trip_id}/suggestions", response_model=schemas.TripSuggestions)
def suggest(
    trip_id: str, user_id: str = Depends(current_user_id)
) -> schemas.TripSuggestions:
    return trips_service.suggest_itinerary(user_id, trip_id)


@router.get("/shared/{share_token}", response_model=schemas.Trip)
def get_shared(share_token: str) -> schemas.Trip:
    return trips_service.get_shared_trip(share_token)
