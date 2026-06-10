"""Tests for the direct messaging system."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_send_and_fetch_thread(client: TestClient) -> None:
    resp = client.post(
        "/messages",
        json={"fromUser": "alice", "toUser": "bob", "body": "Hey!"},
    )
    assert resp.status_code == 201
    msg = resp.json()
    assert msg["fromUser"] == "alice"
    assert msg["toUser"] == "bob"
    assert msg["body"] == "Hey!"
    assert "createdAt" in msg

    thread = client.get("/messages/alice/bob").json()
    assert len(thread) == 1
    assert thread[0]["body"] == "Hey!"

    # reverse order gets the same thread
    assert len(client.get("/messages/bob/alice").json()) == 1


def test_thread_is_scoped(client: TestClient) -> None:
    client.post("/messages", json={"fromUser": "alice", "toUser": "bob", "body": "a→b"})
    client.post("/messages", json={"fromUser": "alice", "toUser": "carol", "body": "a→c"})
    assert len(client.get("/messages/alice/bob").json()) == 1
    assert len(client.get("/messages/alice/carol").json()) == 1
    assert len(client.get("/messages/bob/carol").json()) == 0


def test_message_validation(client: TestClient) -> None:
    # empty body
    assert client.post(
        "/messages", json={"fromUser": "alice", "toUser": "bob", "body": ""}
    ).status_code == 422
    # same sender and receiver
    assert client.post(
        "/messages", json={"fromUser": "alice", "toUser": "alice", "body": "hi"}
    ).status_code == 422
    # body too long
    assert client.post(
        "/messages", json={"fromUser": "alice", "toUser": "bob", "body": "x" * 1001}
    ).status_code == 422


def test_conversations_list(client: TestClient) -> None:
    client.post("/messages", json={"fromUser": "alice", "toUser": "bob", "body": "1"})
    client.post("/messages", json={"fromUser": "carol", "toUser": "alice", "body": "2"})
    client.post("/messages", json={"fromUser": "dave", "toUser": "bob", "body": "3"})

    alice_convs = client.get("/conversations/alice").json()
    assert set(alice_convs) == {"bob", "carol"}

    bob_convs = client.get("/conversations/bob").json()
    assert set(bob_convs) == {"alice", "dave"}

    # unknown user has no convs
    assert client.get("/conversations/nobody").json() == []
