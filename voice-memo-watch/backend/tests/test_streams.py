"""Tests for livestream concert rooms and WebSocket broadcast."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.routers.streams import RoomManager


def test_create_and_list_stream(client: TestClient) -> None:
    resp = client.post(
        "/streams",
        json={"host": "dj_minji", "title": "Friday night set"},
    )
    assert resp.status_code == 201
    stream = resp.json()
    assert stream["host"] == "dj_minji"
    assert stream["title"] == "Friday night set"
    assert stream["status"] == "live"
    assert stream["listenerCount"] == 0

    streams = client.get("/streams").json()
    assert any(s["id"] == stream["id"] for s in streams)

    fetched = client.get(f"/streams/{stream['id']}").json()
    assert fetched["id"] == stream["id"]
    assert client.get("/streams/nope").status_code == 404


def test_end_stream(client: TestClient) -> None:
    stream = client.post(
        "/streams", json={"host": "alice", "title": "set"}
    ).json()
    assert client.delete(f"/streams/{stream['id']}").status_code == 204
    ended = client.get(f"/streams/{stream['id']}").json()
    assert ended["status"] == "ended"

    # ended streams not in "live" filter
    live = client.get("/streams?status=live").json()
    assert not any(s["id"] == stream["id"] for s in live)

    assert client.delete("/streams/nope").status_code == 404


def test_stream_validation(client: TestClient) -> None:
    assert client.post("/streams", json={"host": "a", "title": "x"}).status_code == 422
    assert client.post("/streams", json={"host": "alice", "title": ""}).status_code == 422


def test_stream_websocket_broadcast(client: TestClient) -> None:
    """Host sends bytes; listener receives them."""
    RoomManager.reset_for_tests()
    stream = client.post(
        "/streams", json={"host": "alice", "title": "jam"}
    ).json()
    with (
        client.websocket_connect(f"/streams/{stream['id']}/ws") as host_ws,
        client.websocket_connect(f"/streams/{stream['id']}/ws") as listener_ws,
    ):
        host_ws.send_bytes(b"\x01\x02\x03")
        received = listener_ws.receive_bytes()
        assert received == b"\x01\x02\x03"


def test_stream_websocket_rejects_ended_stream(client: TestClient) -> None:
    from starlette.websockets import WebSocketDisconnect

    RoomManager.reset_for_tests()
    stream = client.post(
        "/streams", json={"host": "alice", "title": "jam"}
    ).json()
    client.delete(f"/streams/{stream['id']}")
    try:
        with client.websocket_connect(f"/streams/{stream['id']}/ws"):
            pass
    except WebSocketDisconnect as exc:
        assert exc.code == 4004


def test_stream_websocket_unknown_stream(client: TestClient) -> None:
    from starlette.websockets import WebSocketDisconnect

    RoomManager.reset_for_tests()
    try:
        with client.websocket_connect("/streams/nope/ws"):
            pass
    except WebSocketDisconnect as exc:
        assert exc.code == 4004
