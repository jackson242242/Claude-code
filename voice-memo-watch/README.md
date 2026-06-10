# VoiceMemoBot — voice memo → AI music remix → its own social feed

A standalone product (separate from the World Cup app): record a voice memo
(Apple Watch or browser), let the AI recorder bot remix it into music, tweak
the result with one-click tools, and post it to **VoiceMemoBot's own social
platform** — an in-app feed with likes and permalinks. Nothing is shared out
to existing social networks.

```
watchos/   SwiftUI watchOS app (record → pick style → tweak → post → feed)
backend/   FastAPI service: API + web prototype UI + the feed
```

## Try the prototype in your browser

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cd backend && .venv/bin/uvicorn app.main:app --reload
# open http://localhost:8000
```

The page at `/` is a clickable prototype of the whole product — no watch or
Xcode needed:

1. **Record** with your mic (encoded to WAV in the browser so the offline DSP
   genuinely transforms it), or click **Use demo memo** (synthesized melody)
   if you have no mic.
2. **Pick a vibe** — one click renders the remix.
3. **Result screen** — every tool that changes the original memo is **one or
   two clicks away**: style chips re-render in another vibe; 🐢 Slower /
   🐇 Faster / 🌊 Echo / 🔊 Louder / 🔉 Softer / ⏪ Reverse each apply
   instantly; 🎵 instrument chips (piano · strings · synth · flute · drums)
   toggle synthesized layers that follow your memo's melody and rhythm —
   pick one or several; and a free-text **sound prompt** ("an anime villain
   talking", "a tired sigh") applies with one click. Tools always re-render
   from the *original* memo (they never stack on a render).
4. **Post to Feed** — one click publishes to the platform; the Feed tab shows
   everyone's remixes with playback, ♥ likes, and `/p/{id}` permalinks.

## API

- `POST /memos` — multipart upload (15 MB cap, audio types only).
- `POST /memos/{id}/renders` — body `{"style": "lofi", "tweaks": {"speed":
  1.25, "echo": 0.5, "volume": 1.0, "reverse": false}, "instruments":
  ["piano", "drums"], "prompt": "a tired sigh"}`; returns
  `{status, fileUrl, tweaks, instruments, prompt, …}`. Everything is
  validated server-side (speed 0.5–2, echo 0–1, volume 0.1–2, known
  instrument ids only, prompt ≤ 200 chars).
- `GET /instruments` — the instrument catalog (`piano`, `strings`, `synth`,
  `flute`, `drums`).
- `POST /posts` — `{"renderId", "author", "caption"}` publishes a render to
  the feed. `GET /posts` (newest first), `POST /posts/{id}/like`,
  `DELETE /posts/{id}`, and `GET /p/{post_id}` (public HTML permalink).
- All JSON is camelCase (Pydantic alias generator) and maps 1:1 onto the
  Swift `Codable` models and the web UI's JS.

### Music providers (same registry pattern as the main backend)

- **Mock (default, offline):** real stdlib DSP on WAV input so the whole flow
  is audibly testable with no keys: style presets (tempo/echo/attenuation),
  tweaks (speed/echo/volume/reverse), **instrument layers** synthesized from
  the memo's amplitude envelope + zero-crossing pitch track (humming a melody
  really plays it on the chosen instruments), and **prompt keywords** mapped
  to DSP ("whisper" → quiet, "demon" → deep, "robot" → ring modulation,
  "cave" → echo…). Non-WAV input (the watch's `.m4a`) passes through
  unchanged.
- **Replicate MusicGen (production):** set `REPLICATE_API_TOKEN` and the
  registry switches to melody-conditioned MusicGen — your memo is the melody;
  style, tweaks, instruments, and your free-text prompt all become prompt
  conditioning. ~$0.01–0.10 per generation, 30–120 s latency. True
  character-voice conversion ("talks like a specific anime character") needs
  a dedicated voice-conversion model behind the same provider interface —
  and note that imitating specific copyrighted characters' voices raises
  IP/publicity-rights issues that need legal review before launch.

Styles: `lofi`, `edm`, `acoustic`, `cinematic` (`GET /styles`).

## Watch app

```bash
cd watchos && xcodegen generate && open VoiceMemoBot.xcodeproj
# Point AppConfig.apiBaseURL at your machine's LAN IP, run on a watch simulator.
```

Vertical-page TabView: **Create** (record → style → result with one-tap
style chips + tweak buttons + "Post to Feed") and **Feed** (browse + ♥ like).

## Tests

```bash
cd backend && .venv/bin/python -m pytest   # coverage gate ≥ 80%
```

Env vars: `VOICEMEMO_STORAGE_DIR` (default `var/storage`), `PUBLIC_BASE_URL`
(default `http://localhost:8000` — set to the deployed origin so file URLs and
permalinks are correct), `REPLICATE_API_TOKEN` (enables real AI generation).

## Production viability — read before shipping

- **The platform needs accounts.** Posts currently carry a free-text handle;
  real launch needs auth (Sign in with Apple is the natural fit), profiles,
  and moderation/reporting for user-generated audio — legally required in
  most app-store contexts.
- **Generation is slow (30–120 s) on the real provider.** Renders carry a
  `status` field (`processing/ready/failed`); the HTTP API blocks today, so
  moving the Replicate call to a background worker + polling needs no
  contract change. The one-click tweak loop is instant on the mock but needs
  caching/queueing UX on the real provider.
- **Storage is ephemeral.** Metadata is in-memory and files are on local
  disk — fine for dev/tests, lost on redeploy. Production: S3/R2 + Postgres;
  both swaps are contained to `backend/app/store.py`.
- **Abuse & privacy.** GPU-backed endpoints need auth + rate limits before
  going public; voice is personal data — `DELETE /memos/{id}` exists, and a
  retention policy is required for launch. Likes are unauthenticated in the
  prototype (one tap = one like, no dedupe).
- **Apple requirements.** Building needs macOS/Xcode; distribution needs an
  Apple Developer account, App Review (mic usage description is set in
  `project.yml`), HTTPS API (ATS), and a privacy policy. Apps with
  user-generated content must ship blocking/reporting to pass review.

## Deployment & monitoring

- The root `render.yaml` includes a `voicememobot-api` service: once this code
  reaches the branch Render's Blueprint reads (the repo's default branch),
  Render deploys the API + web prototype publicly. `RENDER_EXTERNAL_URL` is
  picked up automatically, so file URLs and permalinks are correct with no
  manual wiring. Until that merge happens, **there is no public site** — run
  it locally (commands above).
- `.github/workflows/site-health.yml` ("Majordomo site health") probes the
  deployed sites every 30 minutes from GitHub Actions (the build sandbox
  cannot reach onrender.com), opens a `site-down` GitHub issue when a site is
  unreachable, and closes it on recovery. Add VoiceMemoBot's deployed URL to
  the repo variable `VOICEMEMOBOT_URL` after the first deploy to include it
  in the probes.
