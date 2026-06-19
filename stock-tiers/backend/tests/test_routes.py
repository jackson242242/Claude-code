"""Route-level tests via TestClient with the mock provider."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.deps import get_stock_provider
from app.main import create_app
from app.providers.mock import MockStockDataProvider


@pytest.fixture
def client() -> TestClient:
    app = create_app()
    provider = MockStockDataProvider()
    app.dependency_overrides[get_stock_provider] = lambda: provider
    # Provide app.state bits normally set by lifespan (lifespan isn't run here).
    app.state.stock_provider = provider
    return TestClient(app)


def test_health(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_hot_stocks_returns_camel(client: TestClient) -> None:
    resp = client.get("/api/screener/hot-stocks")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list) and data
    assert "oneYearChangePct" in data[0]


def test_quote_known(client: TestClient) -> None:
    resp = client.get("/api/quotes/NVDA")
    assert resp.status_code == 200
    assert resp.json()["ticker"] == "NVDA"


def test_quote_unknown_error_shape(client: TestClient) -> None:
    resp = client.get("/api/quotes/NOPE")
    assert resp.status_code == 404
    body = resp.json()
    assert body == {"error": {"message": "Unknown ticker: NOPE", "type": "not_found"}}


def test_tiers_without_key_is_503(client: TestClient) -> None:
    # No ANTHROPIC_API_KEY in the test env -> get_tier_engine raises 503.
    resp = client.post("/api/tiers", json={"hotStockTicker": "NVDA"})
    assert resp.status_code == 503
    assert resp.json()["error"]["type"] == "not_configured"
