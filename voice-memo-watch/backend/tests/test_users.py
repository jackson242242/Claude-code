"""Tests for user profiles, follow/unfollow, feeds, and user homepage."""
from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import make_wav


def _make_post(client: TestClient, author: str = "alice", style: str = "lofi") -> dict:
    memo = client.post(
        "/memos", files={"file": ("m.wav", make_wav(), "audio/wav")}
    ).json()
    render = client.post(f"/memos/{memo['id']}/renders", json={"style": style}).json()
    return client.post(
        "/posts", json={"renderId": render["id"], "author": author}
    ).json()


def test_upsert_and_get_user(client: TestClient) -> None:
    resp = client.post(
        "/users",
        json={"username": "alice", "displayName": "Alice W", "bio": "I make beats."},
    )
    assert resp.status_code == 201
    user = resp.json()
    assert user["username"] == "alice"
    assert user["displayName"] == "Alice W"
    assert user["bio"] == "I make beats."
    assert user["followerCount"] == 0
    assert user["postCount"] == 0

    fetched = client.get("/users/alice").json()
    assert fetched["username"] == "alice"
    assert client.get("/users/nobody").status_code == 404


def test_upsert_user_validates_username(client: TestClient) -> None:
    assert client.post("/users", json={"username": "a b"}).status_code == 422
    assert client.post("/users", json={"username": "x"}).status_code == 422  # too short


def test_follow_and_unfollow(client: TestClient) -> None:
    client.post("/users", json={"username": "alice"})
    client.post("/users", json={"username": "bob"})
    assert client.post("/users/alice/follow?follower=bob").status_code == 204
    alice = client.get("/users/alice").json()
    assert alice["followerCount"] == 1
    bob = client.get("/users/bob").json()
    assert bob["followingCount"] == 1

    followers = client.get("/users/alice/followers").json()
    assert "bob" in followers
    following = client.get("/users/bob/following").json()
    assert "alice" in following

    # double-follow is idempotent
    assert client.post("/users/alice/follow?follower=bob").status_code == 204
    assert client.get("/users/alice").json()["followerCount"] == 1

    # unfollow
    assert client.delete("/users/alice/follow?follower=bob").status_code == 204
    assert client.get("/users/alice").json()["followerCount"] == 0
    assert client.delete("/users/alice/follow?follower=bob").status_code == 404

    # follow unknown user
    assert client.post("/users/nobody/follow?follower=bob").status_code == 404


def test_user_posts(client: TestClient) -> None:
    _make_post(client, author="alice")
    _make_post(client, author="alice")
    _make_post(client, author="bob")
    alice = client.get("/users/alice")
    assert alice.status_code == 200
    posts = client.get("/users/alice/posts").json()
    assert len(posts) == 2
    assert all(p["author"] == "alice" for p in posts)
    assert client.get("/users/nobody/posts").status_code == 404


def test_user_feed_from_followed(client: TestClient) -> None:
    _make_post(client, author="alice")
    _make_post(client, author="charlie")
    # bob follows alice but not charlie
    client.post("/users/alice/follow?follower=bob")
    feed = client.get("/users/bob/feed").json()
    assert len(feed) == 1
    assert feed[0]["author"] == "alice"
    assert client.get("/users/nobody/feed").status_code == 404


def test_user_homepage(client: TestClient) -> None:
    client.post("/users", json={"username": "alice", "displayName": "Alice", "bio": "Beats"})
    _make_post(client, author="alice")
    page = client.get("/users/alice/page")
    assert page.status_code == 200
    assert "Alice" in page.text
    assert "Beats" in page.text
    assert "sound-card" in page.text or "sound-grid" in page.text or "sound-mini" in page.text
    assert client.get("/users/nobody/page").status_code == 404


def test_post_auto_creates_user(client: TestClient) -> None:
    """Posting as 'newuser' should auto-register that user."""
    _make_post(client, author="newuser")
    assert client.get("/users/newuser").status_code == 200
