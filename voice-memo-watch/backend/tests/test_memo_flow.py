from __future__ import annotations

import wave

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


def test_web_prototype_served_at_root(client: TestClient) -> None:
    page = client.get("/")
    assert page.status_code == 200
    assert "VoiceMemoBot" in page.text
    assert 'id="tab-feed"' in page.text  # the platform feed tab
    assert 'id="tools"' in page.text  # one-click remix tools


def test_styles_catalog(client: TestClient) -> None:
    styles = client.get("/styles").json()
    assert {s["id"] for s in styles} == {"lofi", "edm", "acoustic", "cinematic"}
    assert all({"id", "label", "description"} <= set(s) for s in styles)


def test_instruments_catalog(client: TestClient) -> None:
    instruments = client.get("/instruments").json()
    assert {i["id"] for i in instruments} == {
        "piano",
        "strings",
        "synth",
        "flute",
        "drums",
    }
    assert all({"id", "label", "description"} <= set(i) for i in instruments)


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


def test_render_and_download_flow(client: TestClient) -> None:
    memo = _upload(client)

    render = client.post(f"/memos/{memo['id']}/renders", json={"style": "lofi"})
    assert render.status_code == 201
    body = render.json()
    assert body["status"] == "ready"
    assert body["memoId"] == memo["id"]
    assert body["fileUrl"].endswith(f"/renders/{body['id']}/file")
    assert body["tweaks"] == {
        "speed": 1.0,
        "echo": 0.0,
        "volume": 1.0,
        "reverse": False,
    }
    assert body["instruments"] == []
    assert body["prompt"] == ""

    fetched = client.get(f"/renders/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["style"] == "lofi"

    audio = client.get(f"/renders/{body['id']}/file")
    assert audio.status_code == 200
    assert audio.content[:4] == b"RIFF"
    assert audio.content != make_wav()  # the transform audibly changed the file


def test_render_with_tweaks_changes_output(client: TestClient) -> None:
    memo = _upload(client)
    plain = client.post(
        f"/memos/{memo['id']}/renders", json={"style": "acoustic"}
    ).json()
    tweaked = client.post(
        f"/memos/{memo['id']}/renders",
        json={
            "style": "acoustic",
            "tweaks": {"speed": 1.5, "echo": 0.5, "volume": 0.5, "reverse": True},
        },
    ).json()
    assert tweaked["tweaks"]["speed"] == 1.5
    assert tweaked["tweaks"]["reverse"] is True

    plain_audio = client.get(f"/renders/{plain['id']}/file").content
    tweaked_audio = client.get(f"/renders/{tweaked['id']}/file").content
    assert plain_audio != tweaked_audio


def test_render_rejects_out_of_range_tweaks(client: TestClient) -> None:
    memo = _upload(client)
    response = client.post(
        f"/memos/{memo['id']}/renders",
        json={"style": "lofi", "tweaks": {"speed": 9.0}},
    )
    assert response.status_code == 422
    assert response.json()["error"]["type"] == "validation_error"


def test_render_with_instruments_and_prompt(client: TestClient) -> None:
    memo = _upload(client)
    plain = client.post(
        f"/memos/{memo['id']}/renders", json={"style": "acoustic"}
    ).json()
    remixed = client.post(
        f"/memos/{memo['id']}/renders",
        json={
            "style": "acoustic",
            "instruments": ["piano", "drums"],
            "prompt": "a demon villain talks in a cave",
        },
    ).json()
    assert remixed["instruments"] == ["piano", "drums"]
    assert remixed["prompt"] == "a demon villain talks in a cave"

    plain_audio = client.get(f"/renders/{plain['id']}/file").content
    remixed_audio = client.get(f"/renders/{remixed['id']}/file").content
    assert plain_audio != remixed_audio


def test_render_rejects_unknown_instrument_and_long_prompt(
    client: TestClient,
) -> None:
    memo = _upload(client)
    unknown = client.post(
        f"/memos/{memo['id']}/renders",
        json={"style": "lofi", "instruments": ["kazoo"]},
    )
    assert unknown.status_code == 422
    assert "kazoo" in unknown.json()["error"]["message"]

    too_long = client.post(
        f"/memos/{memo['id']}/renders",
        json={"style": "lofi", "prompt": "x" * 201},
    )
    assert too_long.status_code == 422


def test_public_urls_use_render_external_url(
    client: TestClient, monkeypatch
) -> None:
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://voicememobot.onrender.com/")
    memo = _upload(client)
    render = client.post(
        f"/memos/{memo['id']}/renders", json={"style": "lofi"}
    ).json()
    assert render["fileUrl"].startswith("https://voicememobot.onrender.com/")
    post = client.post("/posts", json={"renderId": render["id"]}).json()
    assert post["permalink"].startswith("https://voicememobot.onrender.com/p/")
    # explicit PUBLIC_BASE_URL still wins
    monkeypatch.setenv("PUBLIC_BASE_URL", "https://memo.example.com")
    fetched = client.get(f"/renders/{render['id']}").json()
    assert fetched["fileUrl"].startswith("https://memo.example.com/")


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
        def render(self, input_path, output_path, spec) -> None:
            raise RuntimeError("kaput")

    monkeypatch.setattr(memos_router, "music_provider", lambda: Boom())
    memo = _upload(client)
    response = client.post(f"/memos/{memo['id']}/renders", json={"style": "edm"})
    assert response.status_code == 502


def test_delete_memo_removes_renders_and_posts(client: TestClient) -> None:
    memo = _upload(client)
    render = client.post(
        f"/memos/{memo['id']}/renders", json={"style": "cinematic"}
    ).json()
    post = client.post("/posts", json={"renderId": render["id"]}).json()
    assert client.delete(f"/memos/{memo['id']}").status_code == 204
    assert client.delete(f"/memos/{memo['id']}").status_code == 404
    assert client.get(f"/renders/{render['id']}").status_code == 404
    assert client.get(f"/posts/{post['id']}").status_code == 404
