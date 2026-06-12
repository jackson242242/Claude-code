from __future__ import annotations

import pytest

from app.data import load_world
from app.engine.commands import apply_commands
from app.engine.state import GameState, World, new_game


@pytest.fixture(scope="session")
def world() -> World:
    return load_world()


@pytest.fixture
def game(world: World) -> GameState:
    """A fresh game headquartered in New York (the CONTRACT §3 reference HQ)."""
    return new_game("g-test", "Test Air", world.cities["nyc"])


def run(state: GameState, world: World, *commands: dict):
    """Apply commands and fail the test on the first rejected one."""
    results = apply_commands(state, world, list(commands))
    for result in results:
        assert result.ok, f"command {result.index} failed: {result.message}"
    return results
