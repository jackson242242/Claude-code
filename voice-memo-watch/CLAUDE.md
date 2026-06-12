# Project: VoiceMemoBot (`voice-memo-watch/`)

> A **separate product** from Matchday26 — don't share code, types, or data between them.
> The workspace-wide constitution (principles, gates, guardrails) is in the root `CLAUDE.md`;
> this file holds VoiceMemoBot's specifics. See also `voice-memo-watch/README.md`.

## Overview
Record a voice memo (Apple Watch or browser) → an AI recorder bot remixes it into music →
tweak the result with one-click tools → post it to **VoiceMemoBot's own in-app social feed**
(likes + permalinks). Nothing is shared out to external social networks.

## Layout
```
watchos/   SwiftUI watchOS app (record → pick style → tweak → post → feed)
  VoiceMemoBot/  App, APIClient, Recorder, Models, Views/* ; project.yml (XcodeGen)
backend/   FastAPI service: JSON API + a clickable web prototype UI + the feed
  app/main.py            Entry (routers, CORS, error handling)
  app/routers/           memos · posts · styles
  app/providers/         Music adapters + registry (mock DSP default; Replicate MusicGen real)
  app/catalog.py store.py schemas.py
  app/web/index.html     Browser prototype of the whole flow (no watch/Xcode needed)
  tests/                 pytest
```

## Commands
- **Install / run backend:** `python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt`
  then `cd voice-memo-watch/backend && .venv/bin/uvicorn app.main:app --reload` → http://localhost:8000
  (the page at `/` is a full clickable prototype — record with your mic or use the demo memo).
- **Tests:** `cd voice-memo-watch/backend && python -m pytest -q` (this is the `voice-memo-backend` CI job).
- **watchOS app:** generated with XcodeGen from `watchos/project.yml` (needs macOS + Xcode; not run in CI).

## Architecture & Conventions
- **Music providers:** same registry pattern as the Matchday26 backend — an abstract provider with a
  **mock default that does real stdlib DSP** on WAV input (so the flow works fully offline), and a real
  **Replicate MusicGen** adapter selected by env. Tweaks always re-render from the *original* memo, never stacked.
- **JSON contract:** camelCase (Pydantic alias generator), mapping 1:1 onto the Swift `Codable` models and
  the web UI's JS. Server-side validation on every field (speed 0.5–2, echo 0–1, volume 0.1–2, known
  instrument ids, prompt ≤ 200 chars, 15 MB upload cap, audio types only).
- **API surface:** `POST /memos`, `POST /memos/{id}/renders`, `GET /instruments`, `POST /posts`,
  `GET /posts`, `POST /posts/{id}/like`, `DELETE /posts/{id}`, `GET /p/{post_id}` (public HTML permalink).
- **Tests mirror source** in `backend/tests/`; keep new features covered.
