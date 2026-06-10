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
