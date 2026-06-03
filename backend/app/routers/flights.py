from __future__ import annotations

from fastapi import APIRouter

from app import schemas
from app.providers import registry

router = APIRouter(prefix="/flights", tags=["flights"])


@router.post("/search", response_model=list[schemas.FlightOffer])
def search_flights(query: schemas.FlightSearchQuery) -> list[schemas.FlightOffer]:
    return registry.flight_provider().search(query)
