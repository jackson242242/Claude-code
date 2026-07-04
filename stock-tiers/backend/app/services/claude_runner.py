"""Shared Claude structured-output runner.

One place for the call shape every engine (tiers / trends / research) uses:
adaptive thinking + effort, a cached system prompt, optional server-side web
search with the pause_turn continuation loop, and tool_use extraction.
"""

from __future__ import annotations

import logging
from typing import Any

import anthropic

from app.config import Settings
from app.errors import AppError
from app.services.tier_prompt import WEB_SEARCH_TOOL

logger = logging.getLogger(__name__)

# Max model turns to allow for the web-search (pause_turn) loop before giving up.
_MAX_TURNS = 6


async def call_claude_tool(
    client: anthropic.AsyncAnthropic,
    settings: Settings,
    *,
    system_prompt: str,
    user_message: str,
    emit_tool: dict[str, Any],
) -> tuple[dict[str, Any], str | None]:
    """Call Claude and return the `emit_tool` tool_use input + stop_reason.

    tool_choice must be "auto" (not forced) because adaptive thinking is on —
    Anthropic rejects forced tool use while thinking is enabled. With web
    search (a server tool) the model may search across several turns and
    return stop_reason="pause_turn"; re-send the accumulated content until it
    finishes and calls the emit tool. max_tokens is generous because adaptive
    thinking shares the budget (a small cap truncates the tool call).
    """
    tools: list[Any] = [emit_tool]
    if settings.tier_web_search:
        tools = [WEB_SEARCH_TOOL, emit_tool]

    messages: list[dict[str, Any]] = [{"role": "user", "content": user_message}]
    resp = None
    for _ in range(_MAX_TURNS):
        try:
            # The SDK's create() overloads use TypedDict unions; our dict literals
            # are valid at runtime but don't match in strict mode — ignore here.
            resp = await client.messages.create(  # type: ignore[call-overload]
                model=settings.tier_model,
                max_tokens=16000,
                thinking={"type": "adaptive"},
                output_config={"effort": settings.tier_effort},
                system=[
                    {
                        "type": "text",
                        "text": system_prompt,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                tools=tools,
                tool_choice={"type": "auto"},
                messages=messages,
            )
        except anthropic.APIError as exc:  # typed SDK error chain
            detail = (getattr(exc, "message", "") or str(exc))[:300]
            logger.warning("anthropic call failed: %s", exc)
            raise AppError(
                f"Tier engine error: {detail}", type="upstream_error", status=502
            ) from exc

        if getattr(resp, "stop_reason", None) == "pause_turn":
            # Server tool (web search) paused mid-loop — continue it.
            messages.append({"role": "assistant", "content": resp.content})
            continue
        break

    stop_reason = getattr(resp, "stop_reason", None)
    tool_name = str(emit_tool["name"])
    for block in resp.content if resp is not None else []:
        if getattr(block, "type", None) == "tool_use" and block.name == tool_name:
            # block.input is already a parsed object — never raw-string-match it.
            return dict(block.input), stop_reason
    raise AppError("Tier engine returned no result", type="upstream_error", status=502)
