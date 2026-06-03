from __future__ import annotations

from fastapi import APIRouter

from app import schemas
from app.providers import registry

router = APIRouter(prefix="/transport", tags=["transport"])


@router.post("/search", response_model=list[schemas.TransportOffer])
def search_transport(
    query: schemas.TransportSearchQuery,
) -> list[schemas.TransportOffer]:
    return registry.transport_provider().search(query)
