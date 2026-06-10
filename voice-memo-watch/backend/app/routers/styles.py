from __future__ import annotations

from fastapi import APIRouter

from app.catalog import INSTRUMENTS, STYLES
from app.schemas import Instrument, Style

router = APIRouter(tags=["styles"])


@router.get("/styles", response_model=list[Style])
def list_styles() -> list[Style]:
    return STYLES


@router.get("/instruments", response_model=list[Instrument])
def list_instruments() -> list[Instrument]:
    return INSTRUMENTS
