"""Tests for VoiceMemoBot's own social platform: posts, feed, likes,
permalink pages."""
from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import make_wav


def _make_render(client: TestClient, style: str = "lofi") -> dict:
    memo = client.post(
        "/memos", files={"file": ("memo.wav", make_wav(), "audio/wav")}
    ).json()
    return client.post(f"/memos/{memo['id']}/renders", json={"style": style}).json()


def test_post_create_and_fetch(client: TestClient) -> None:
    render = _make_render(client)
    response = client.post(
        "/posts",
        json={"renderId": render["id"], "author": "minji", "caption": "first jam!"},
    )
    assert response.status_code == 201
    post = response.json()
    assert post["author"] == "minji"
    assert post["caption"] == "first jam!"
    assert post["style"] == "lofi"
    assert post["likes"] == 0
    assert post["fileUrl"].endswith(f"/renders/{render['id']}/file")
    assert post["permalink"].endswith(f"/p/{post['id']}")

    fetched = client.get(f"/posts/{post['id']}")
    assert fetched.status_code == 200
    assert fetched.json() == post


def test_post_defaults_to_anonymous(client: TestClient) -> None:
    render = _make_render(client)
    post = client.post("/posts", json={"renderId": render["id"]}).json()
    assert post["author"] == "anonymous"
    assert post["caption"] == ""


def test_post_requires_existing_render(client: TestClient) -> None:
    assert client.post("/posts", json={"renderId": "nope"}).status_code == 404


def test_post_rejects_oversized_caption(client: TestClient) -> None:
    render = _make_render(client)
    response = client.post(
        "/posts", json={"renderId": render["id"], "caption": "x" * 281}
    )
    assert response.status_code == 422


def test_feed_is_newest_first(client: TestClient) -> None:
    first = client.post(
        "/posts", json={"renderId": _make_render(client, "lofi")["id"]}
    ).json()
    second = client.post(
        "/posts", json={"renderId": _make_render(client, "edm")["id"]}
    ).json()
    feed = client.get("/posts").json()
    assert [post["id"] for post in feed] == [second["id"], first["id"]]


def test_like_increments(client: TestClient) -> None:
    post = client.post(
        "/posts", json={"renderId": _make_render(client)["id"]}
    ).json()
    assert client.post(f"/posts/{post['id']}/like").json()["likes"] == 1
    assert client.post(f"/posts/{post['id']}/like").json()["likes"] == 2
    assert client.post("/posts/nope/like").status_code == 404


def test_delete_post(client: TestClient) -> None:
    post = client.post(
        "/posts", json={"renderId": _make_render(client)["id"]}
    ).json()
    assert client.delete(f"/posts/{post['id']}").status_code == 204
    assert client.delete(f"/posts/{post['id']}").status_code == 404


def test_forward_post(client: TestClient) -> None:
    original = client.post(
        "/posts", json={"renderId": _make_render(client)["id"], "author": "alice"}
    ).json()
    forward = client.post(
        f"/posts/{original['id']}/forward",
        json={"author": "bob", "caption": "check this out"},
    )
    assert forward.status_code == 201
    fwd = forward.json()
    assert fwd["forwardedFrom"] == original["id"]
    assert fwd["author"] == "bob"
    assert fwd["caption"] == "check this out"
    assert client.post("/posts/nope/forward", json={}).status_code == 404


def test_comments_crud(client: TestClient) -> None:
    post = client.post(
        "/posts", json={"renderId": _make_render(client)["id"]}
    ).json()
    # empty at first
    assert client.get(f"/posts/{post['id']}/comments").json() == []
    # add two comments
    c1 = client.post(
        f"/posts/{post['id']}/comments",
        json={"author": "alice", "body": "love it!"},
    )
    assert c1.status_code == 201
    assert c1.json()["body"] == "love it!"
    c2 = client.post(
        f"/posts/{post['id']}/comments",
        json={"author": "bob", "body": "🎵"},
    ).json()
    comments = client.get(f"/posts/{post['id']}/comments").json()
    assert len(comments) == 2
    # delete one
    assert client.delete(f"/comments/{c2['id']}").status_code == 204
    assert len(client.get(f"/posts/{post['id']}/comments").json()) == 1
    # 404s
    assert client.get("/posts/nope/comments").status_code == 404
    assert client.post("/posts/nope/comments", json={"body": "x"}).status_code == 404
    assert client.delete("/comments/nope").status_code == 404


def test_comments_require_body(client: TestClient) -> None:
    post = client.post(
        "/posts", json={"renderId": _make_render(client)["id"]}
    ).json()
    assert client.post(
        f"/posts/{post['id']}/comments", json={"author": "x", "body": ""}
    ).status_code == 422


def test_permalink_page_escapes_user_content(client: TestClient) -> None:
    post = client.post(
        "/posts",
        json={
            "renderId": _make_render(client)["id"],
            "author": "<script>alert(1)</script>",
            "caption": "hello & <b>world</b>",
        },
    ).json()
    page = client.get(f"/p/{post['id']}")
    assert page.status_code == 200
    assert "<audio" in page.text
    assert "<script>alert(1)</script>" not in page.text
    assert "&lt;b&gt;world&lt;/b&gt;" in page.text
    assert client.get("/p/nope").status_code == 404
