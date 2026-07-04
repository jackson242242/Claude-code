"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven settings. See .env.example for the full list."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    stock_provider: Literal["mock", "finnhub"] = "mock"
    finnhub_api_key: str | None = None
    # Max candidates the Finnhub screener scans (keeps the first screen under the
    # free-tier ~60 calls/min limit).
    screener_candidate_limit: int = 30
    anthropic_api_key: str | None = None

    # auto: use Claude when a key is set, else the deterministic mock engine.
    tier_provider: Literal["auto", "mock", "claude"] = "auto"
    tier_model: str = "claude-opus-4-8"
    # Let Claude use web search to ground picks in current facts (set false to
    # disable, e.g. to cut latency/cost or if the account lacks the tool).
    tier_web_search: bool = True
    tier_effort: Literal["low", "medium", "high"] = "high"

    quote_cache_ttl: int = 60
    screener_cache_ttl: int = 900
    tier_cache_ttl: int = 86400

    # Where the portfolio/trends/research JSON store lives. On hosts with
    # ephemeral disks (Render free tier) this resets on redeploy — point it at
    # a persistent disk mount to keep the portfolio across deploys.
    data_dir: str = "data"
    # If set, POST /api/portfolio/research/run requires the x-cron-secret
    # header to match (protects the daily Render Cron endpoint). Unset = open.
    cron_secret: str | None = None
    # How many NEW secular trends one discovery pass proposes.
    trend_discover_count: int = 4

    resilient_fallback: bool = True

    # If set to a directory containing a built web app (Expo web export), the API
    # also serves it at "/" (single-service "one URL" deploy). Unset in dev.
    static_web_dir: str | None = None

    # Comma-separated allowed CORS origins. "*" allows all (default, dev-friendly).
    # Bare hosts (no scheme) are normalized to https:// for the deployed web app.
    cors_origins: str = "*"

    def cors_origin_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        if raw == "*" or not raw:
            return ["*"]
        origins: list[str] = []
        for part in raw.split(","):
            host = part.strip()
            if not host:
                continue
            origins.append(host if "://" in host else f"https://{host}")
        return origins or ["*"]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
