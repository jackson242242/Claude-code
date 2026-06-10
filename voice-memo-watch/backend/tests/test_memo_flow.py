from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import make_wav


def _upload(client: TestClient) -> dict:
    response = client.post(
        "/memos", files={"file": ("memo.wav", make_wav(), "audio/wav")}
    )
    assert response.status_code == 201
    return response.json()


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_styles_catalog(client: TestClient) -> None:
    styles = client.get("/styles").json()
    assert {s["id"] for s in styles} == {"lofi", "edm", "acoustic", "cinematic"}
    assert all({"id", "label", "description"} <= set(s) for s in styles)


def test_upload_serializes_camel_case(client: TestClient) -> None:
    memo = _upload(client)
    assert memo["contentType"] == "audio/wav"
    assert memo["sizeBytes"] > 0
    assert "createdAt" in memo


def test_upload_rejects_non_audio(client: TestClient) -> None:
    response = client.post(
        "/memos", files={"file": ("notes.txt", b"hello", "text/plain")}
    )
    assert response.status_code == 415
    assert response.json()["error"]["type"] == "http_error"


def test_upload_rejects_empty_file(client: TestClient) -> None:
    response = client.post("/memos", files={"file": ("memo.wav", b"", "audio/wav")})
    assert response.status_code == 422


def test_render_download_and_share_flow(client: TestClient) -> None:
    memo = _upload(client)

    render = client.post(f"/memos/{memo['id']}/renders", json={"style": "lofi"})
    assert render.status_code == 201
    body = render.json()
    assert body["status"] == "ready"
    assert body["memoId"] == memo["id"]
    assert body["fileUrl"].endswith(f"/renders/{body['id']}/file")
    assert body["shareUrl"].endswith(f"/share/{body['id']}")

    fetched = client.get(f"/renders/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["style"] == "lofi"

    audio = client.get(f"/renders/{body['id']}/file")
    assert audio.status_code == 200
    assert audio.content[:4] == b"RIFF"
    assert audio.content != make_wav()  # the transform audibly changed the file

    page = client.get(f"/share/{body['id']}")
    assert page.status_code == 200
    assert "<audio" in page.text
    assert 'property="og:audio"' in page.text


def test_render_unknown_style_and_memo(client: TestClient) -> None:
    memo = _upload(client)
    bad_style = client.post(f"/memos/{memo['id']}/renders", json={"style": "polka"})
    assert bad_style.status_code == 422
    missing = client.post("/memos/nope/renders", json={"style": "lofi"})
    assert missing.status_code == 404


def test_render_failure_marks_failed(
    client: TestClient, monkeypatch
) -> None:
    from app.providers.base import MusicProvider
    from app.routers import memos as memos_router

    class Boom(MusicProvider):
        def render(self, input_path, style, output_path) -> None:
            raise RuntimeError("kaput")

    monkeypatch.setattr(memos_router, "music_provider", lambda: Boom())
    memo = _upload(client)
    response = client.post(f"/memos/{memo['id']}/renders", json={"style": "edm"})
    assert response.status_code == 502


def test_delete_memo_removes_renders(client: TestClient) -> None:
    memo = _upload(client)
    render = client.post(
        f"/memos/{memo['id']}/renders", json={"style": "cinematic"}
    ).json()
    assert client.delete(f"/memos/{memo['id']}").status_code == 204
    assert client.delete(f"/memos/{memo['id']}").status_code == 404
    assert client.get(f"/renders/{render['id']}").status_code == 404
    assert client.get(f"/share/{render['id']}").status_code == 404
