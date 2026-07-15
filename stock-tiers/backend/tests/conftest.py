"""Shared test fixtures."""

from __future__ import annotations

import pytest

from app.providers.mock import MockStockDataProvider


@pytest.fixture
def mock_provider() -> MockStockDataProvider:
    return MockStockDataProvider()
