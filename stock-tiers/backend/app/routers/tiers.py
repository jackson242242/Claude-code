"""Tier-list route: LLM-generated S-F ranking for a hot stock."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_claude_engine, get_tier_engine
from app.schemas import ThesisRequest, TierList, TierListRequest
from app.services.tier_engine import TierEngine
from app.services.tier_engine_base import TierEngineProtocol

router = APIRouter(prefix="/api/tiers", tags=["tiers"])


@router.post("", response_model=TierList)
async def create_tier_list(
    body: TierListRequest,
    engine: TierEngineProtocol = Depends(get_tier_engine),
) -> TierList:
    """Generate the S-F tier list of alternatives/downstream for the hot stock."""
    return await engine.generate(body.hot_stock_ticker)


@router.post("/thesis", response_model=TierList)
async def create_thesis_tier_list(
    body: ThesisRequest,
    engine: TierEngine = Depends(get_claude_engine),
) -> TierList:
    """Generate the S-F tier list for a user-written investment thesis + horizon."""
    return await engine.generate_from_thesis(body.thesis, body.horizon)
