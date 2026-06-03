import pytest

from app.config import _cors_origins


def test_cors_origins_defaults_to_localhost(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert _cors_origins() == ("http://localhost:3000",)


def test_cors_origins_normalizes_bare_host_and_trailing_slash(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "worldcup-web.onrender.com, https://foo.com/")
    assert _cors_origins() == (
        "https://worldcup-web.onrender.com",
        "https://foo.com",
    )
