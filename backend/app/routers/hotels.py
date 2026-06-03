from __future__ import annotations

from fastapi import APIRouter

from app import schemas
from app.providers import registry

router = APIRouter(prefix="/hotels", tags=["hotels"])


@router.post("/search", response_model=list[schemas.HotelOffer])
def search_hotels(query: schemas.HotelSearchQuery) -> list[schemas.HotelOffer]:
    return registry.hotel_provider().search(query)
