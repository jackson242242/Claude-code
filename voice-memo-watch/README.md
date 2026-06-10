# VoiceMemoBot — Apple Watch voice memo → AI music → share link

A standalone product (separate from the World Cup app): record a voice memo on
your Apple Watch, send it to the AI recorder bot, get it remixed into music in
a chosen style, and share it instantly via a public link.

```
watchos/   SwiftUI watchOS app (record → pick style → ShareLink)
backend/   FastAPI "recorder bot" (upload, AI music render, share page)
```

## How it works

1. **Record** — the watch records a mono AAC memo with `AVAudioRecorder`.
2. **Upload** — `POST /memos` (multipart, 15 MB cap, audio types only).
3. **Remix** — `POST /memos/{id}/renders {"style": "lofi"}` runs the music
   provider and returns `{status, fileUrl, shareUrl}` (camelCase JSON that maps
   1:1 onto the Swift `Codable` models).
4. **Share** — the watch shares `shareUrl` via `ShareLink`. `GET /share/{id}`
   serves an HTML page with an audio player and Open Graph tags so the link
   unfurls when posted.

### Music providers (same registry pattern as the main backend)

- **Mock (default, offline):** real stdlib DSP on WAV input — tempo shift,
  echo, attenuation per style — so the whole flow is testable with no keys.
  Non-WAV input (the watch's `.m4a`) passes through unchanged.
- **Replicate MusicGen (production):** set `REPLICATE_API_TOKEN` and the
  registry switches to melody-conditioned MusicGen — your memo is the melody,
  the style is the text prompt. ~$0.01–0.10 per generation, 30–120 s latency.

Styles: `lofi`, `edm`, `acoustic`, `cinematic` (`GET /styles`).

## Run it

```bash
# Backend
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cd backend && .venv/bin/uvicorn app.main:app --reload   # http://localhost:8000
.venv/bin/python -m pytest                               # tests (cov ≥ 80%)

# Watch app (requires macOS + Xcode + XcodeGen)
cd watchos && xcodegen generate && open VoiceMemoBot.xcodeproj
# Point AppConfig.apiBaseURL at your machine's LAN IP, run on a watch simulator.
```

Env vars: `VOICEMEMO_STORAGE_DIR` (default `var/storage`), `PUBLIC_BASE_URL`
(default `http://localhost:8000` — set to the deployed origin so share links
are correct), `REPLICATE_API_TOKEN` (enables real AI generation).

## Production viability — read before shipping

- **Social sharing is link-based by design.** Instagram/TikTok/X have no public
  audio-upload APIs and no watchOS share extensions. The shippable pattern
  (as used by Shazam/Spotify) is sharing a link whose page embeds the player +
  OG tags — from the watch via Messages/Mail, or the full social share sheet
  via iPhone Handoff. Upgrade path for video-first platforms: render a
  waveform video from the audio.
- **Generation is slow (30–120 s).** Renders carry a `status` field
  (`processing/ready/failed`); the HTTP API blocks today, so moving the
  Replicate call to a background worker + polling needs no contract change.
- **Storage is ephemeral.** Metadata is in-memory and files are on local disk —
  fine for dev/tests, lost on redeploy (e.g. Render free tier). Production:
  S3/R2 + Postgres; both swaps are contained to `backend/app/store.py`.
- **Abuse & privacy.** GPU-backed endpoints need auth + rate limits before
  going public; voice is personal data — `DELETE /memos/{id}` exists, and a
  retention policy + private-by-default share links are required for launch.
- **Apple requirements.** Building needs macOS/Xcode; distribution needs an
  Apple Developer account, App Review (mic usage description is set in
  `project.yml`), HTTPS API (ATS), and a privacy policy.

To deploy the API on Render, add a service block to the root `render.yaml`
(intentionally not added here to avoid auto-provisioning infra):

```yaml
  - type: web
    name: voicememobot-api
    rootDir: voice-memo-watch/backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
