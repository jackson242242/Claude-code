# Majordomo brief — 2026-06-10 (VoiceMemoBot feature push)

## What just shipped — P2 · VoiceMemoBot (`611c755`)

Branch `claude/inspiring-dirac-j8ar6q` — all 56 tests green at 96% coverage.

### New features
| Feature | Backend | UI |
|---------|---------|-----|
| Voice transcription | `POST /memos/{id}/transcribe` — WAV energy mock; set `WHISPER_API_KEY` for real Whisper | Auto-transcribe toggle in record card; Web Speech API overlay while recording |
| Comments | `POST/GET /posts/{id}/comments`, `DELETE /comments/{id}` | Expandable comments section per post; inline reply form |
| User profiles | `POST/GET /users/{username}` (auto-created on first action) | Sliding profile panel on author click; follow button; "Open full profile" link |
| Follow/unfollow | `POST/DELETE /users/{username}/follow`; follower/following lists; followed-user feed | Profile panel follow button |
| User homepage | `GET /users/{username}/page` — HTML page | Spotify-style sound-card grid with canvas waveform animation + click-to-play |
| Direct messages | `POST /messages`, `GET /messages/{a}/{b}`, `GET /conversations/{user}` | Messages tab with conversation list and thread view |
| Forward/share | `POST /posts/{id}/forward` (`forwardedFrom` field on Post) | Forward button on each post with caption prompt |
| Livestream concerts | `POST/GET/DELETE /streams`; `WS /streams/{id}/ws` — pure PCM relay | Streams tab: Go Live (mic → WebSocket → all listeners hear it in real time); join/leave any live room |

### Tests
- 56 tests (up from 35): `test_users.py` (8), `test_messages.py` (4), `test_streams.py` (6), plus new tests in `test_posts.py` and `test_memo_flow.py`
- Coverage: 96% (gate ≥ 80%)

## Status by project

| Project | Status | Next |
|---------|--------|------|
| P1 Matchday26 | 🟢 | 真实赛程数据缓存（CADENCE §5） |
| P2 VoiceMemoBot | 🟢 code / 🔴 no live URL | **老板操作**：合并工作分支 PR 进部署分支 → Render 自动部署；然后把 `VOICEMEMOBOT_URL` 填进 repo 变量 |
| P3 Thomas Meal | 🟢 | 待老板定方向 |

## Action needed from you
1. Merge the VoiceMemoBot feature branch PR into the deploy branch so Render deploys it.
2. After the first deploy, copy the Render URL into repo variable `VOICEMEMOBOT_URL` so the site-health workflow can probe it.
3. To test locally now: `cd voice-memo-watch/backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/uvicorn app.main:app --reload` → open `http://localhost:8000`.
