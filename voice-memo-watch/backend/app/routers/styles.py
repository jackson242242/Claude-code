from __future__ import annotations

from fastapi import APIRouter

from app.catalog import STYLES
from app.schemas import Style

router = APIRouter(tags=["styles"])


@router.get("/styles", response_model=list[Style])
def list_styles() -> list[Style]:
    return STYLES
