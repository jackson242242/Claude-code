from fastapi.testclient import TestClient

from app.main import app


def test_unhandled_exception_returns_structured_500() -> None:
    def boom() -> None:
        raise RuntimeError("kaboom")

    app.add_api_route("/debug/boom", boom, methods=["GET"])
    client = TestClient(app, raise_server_exceptions=False)

    res = client.get("/debug/boom")
    assert res.status_code == 500
    assert res.json()["error"]["type"] == "internal_error"
