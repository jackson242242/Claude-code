from __future__ import annotations

from fastapi import APIRouter

from app.catalog import INSTRUMENTS, PROMPT_SUGGESTIONS, STYLES
from app.schemas import Instrument, PromptSuggestion, Style

router = APIRouter(tags=["styles"])


@router.get("/styles", response_model=list[Style])
def list_styles() -> list[Style]:
    return STYLES


@router.get("/instruments", response_model=list[Instrument])
def list_instruments() -> list[Instrument]:
    return INSTRUMENTS


@router.get("/prompts/suggestions", response_model=list[PromptSuggestion])
def list_prompt_suggestions() -> list[PromptSuggestion]:
    """Ready-made sound prompts ("agent 提示词") that teach users how to
    describe effects in natural language; every one triggers real DSP."""
    return PROMPT_SUGGESTIONS
