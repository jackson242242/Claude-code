# @NYneighborhood YouTube Automation Pipeline

> Daily loop that produces and posts **3 education videos/day** (2 Shorts + 1 longform)
> to youtube.com/@NYneighborhood (channel `UCSU99qan7oWIEY-c8uYmuSQ`).
> Content strategy: current/future **education trends · world colleges · education
> systems worldwide · what's latest**.
> Owner: minjihuang1983@gmail.com. Maintainer: the `/youtube-cycle` skill
> (`.claude/commands/youtube-cycle.md`), fired by a Routine 3x/day.

## The loop (one run = one video)

```
Routine fires (13:00 / 17:00 / 22:00 UTC = 9am / 1pm / 6pm New York)
  └─ fresh cloud session runs /youtube-cycle
       0. setup: install ffmpeg, detect credential lanes, vidIQ credit check
       1. read state  (state/queue.json · published.json · RUNLOG.md · config.yaml)
       2. pick topic  (queue top; replenish via WebSearch + optional vidIQ research)
       3. script      (Claude writes + fact-checks; sources into description)
       4. media       (ElevenLabs voiceover → Pexels b-roll + ffmpeg assembly → thumbnail)
       5. post        (YouTube Data API upload; Shorts 9:16 ≤60s, longform 16:9)
       6. analytics   (1x/day vidIQ channel pulse → steer tomorrow's queue)
       7. write back  (state files + RUNLOG → commit → push)   ← cross-run memory
```

Every run degrades gracefully: a missing credential skips that lane and the run says
so honestly in `state/RUNLOG.md` — it never fakes a post. With zero credentials the
run still replenishes the topic queue and produces script packages (dry-run).

## Platform map — what the owner asked for vs. what is actually automatable

The original request named specific tools. Honest assessment (verified 2026-07):

| Requested | Official API? | In this pipeline | Notes |
|---|---|---|---|
| Claude / GetPoppy (ideas & scripts) | Claude: yes (this session) · Poppy: no public API | ✅ **Claude native** — ideation, scripting, fact-checking | Poppy is a browser whiteboard tool; no headless surface. Claude covers it. |
| copy.ai (YT scripts) | Workflows API (paid plans) | 🔌 Optional lane via `COPYAI_API_KEY` | Redundant with Claude for scripts; enable only if you already pay for it. |
| jasper.ai (YT content) | Enterprise/business-gated API | 🔌 Optional lane via `JASPER_API_KEY` | Same capability covered by Claude at zero marginal cost. |
| nichesss (niches & ideas) | No public API | ✅ Replaced: vidIQ `keyword_research` + `trending_videos` + Claude | Web-app only. |
| "SM suite" viral idea finder | No identifiable API product | ✅ Replaced: vidIQ `outliers`/`trending_videos` (MCP, connected) | vidIQ's outlier finder is exactly this. |
| invideo.io (text-to-video) | No public API | ✅ Replaced: **Pexels b-roll + ffmpeg** (`scripts/assemble-video.mjs`) | invideo is app-only; our lane is free and headless. |
| kling.ai (video gen) | Yes — official developer API (access-key + secret JWT) | 🔌 Optional lane via `KLING_ACCESS_KEY`/`KLING_SECRET_KEY` | Paid per-generation; use for hero videos, not 3x/day. |
| elevenlabs (voiceover) | Yes | ✅ Primary voice lane (`scripts/elevenlabs-tts.mjs`, `ELEVENLABS_API_KEY`) | Free tier ~10k chars/mo covers ~2 Shorts/day; starter plan recommended for 3/day. Fallback: vidIQ voiceover. |
| vidIQ (analytics) | ✅ MCP server connected to this workspace | ✅ Analytics + keyword research + title scoring (+ generation fallbacks) | Account: 150 credits/mo — the loop budgets ≤10/run, floor 40 (see config.yaml). |
| Midjourney (cover design) | **No official API**; Discord automation violates their ToS | ❌ Not automated — replaced by OpenAI Images (`scripts/generate-asset.mjs`) or vidIQ thumbnail gen | We don't do ToS-violating automation. |
| Canva (thumbnails) | Connect API exists; the Canva MCP connector needs owner OAuth | 🔌 Available after you authorize Canva in claude.ai connector settings | Headless routine runs may not carry the connector; primary lane is OpenAI Images. |
| YouTube posting | YouTube Data API v3 | ✅ `scripts/youtube-upload.mjs` (resumable upload, scheduling, thumbnails) | See quota + audit caveats below. |

**YouTube caveats (important, honest):**
- `videos.insert` costs ~1600 quota units; default project quota 10,000/day → 3 uploads
  (4,800) fit comfortably.
- **New/unverified Google Cloud projects get API uploads locked private** until the
  project passes YouTube's API compliance audit. Until then the loop still uploads
  (private) and records the real status; flip them public in Studio, or complete the
  audit (form linked from the API console) to unlock direct public posting.
- AI disclosure: descriptions state AI narration; for realistic synthetic scenes tick
  "altered content" in Studio (no public API field for it yet).
- An OAuth consent screen left in "Testing" mode issues refresh tokens that die after
  7 days — publish the app once so the automation token is durable.

## Credentials checklist (owner actions — add as environment secrets, never in chat)

| Purpose | Env vars | Allowlist hosts | Get it |
|---|---|---|---|
| **Post to YouTube** (required to post) | `YOUTUBE_CLIENT_ID` `YOUTUBE_CLIENT_SECRET` `YOUTUBE_REFRESH_TOKEN` | `oauth2.googleapis.com`, `www.googleapis.com` | Cloud console → enable *YouTube Data API v3* → OAuth *Desktop* client → run `scripts/youtube-oauth-helper.mjs` on your machine |
| **Voiceover** (required to make videos) | `ELEVENLABS_API_KEY` (optional `ELEVENLABS_VOICE_ID`) | `api.elevenlabs.io` | elevenlabs.io → Settings → API keys |
| **B-roll footage** (required to make videos) | `PEXELS_API_KEY` | `api.pexels.com`, `*.pexels.com` | pexels.com/api (free) |
| Thumbnails | `OPENAI_API_KEY` | `api.openai.com` | platform.openai.com (repo already uses this for design assets) |
| Optional: Kling video gen | `KLING_ACCESS_KEY` `KLING_SECRET_KEY` | `api-singapore.klingai.com` | klingai.com developer console |
| Optional: copy.ai / Jasper | `COPYAI_API_KEY` / `JASPER_API_KEY` | their API hosts | only if you already subscribe |
| Optional: Canva | (no env var — OAuth connector) | — | claude.ai → Settings → Connectors → Canva → authorize |
| vidIQ | already connected (minjihuang1983@gmail.com, channel authorized) | — | nothing to do |

Minimum set to go fully live: **YouTube (3 vars) + ElevenLabs + Pexels.**
Until those exist the loop runs in dry-run mode (scripts + metadata committed,
no fake posts).

## Budgets & guardrails
- vidIQ: ≤10 credits/run, stop generation below 40 balance (150/mo cap — see
  `config.yaml`). Default lanes are zero-marginal-cost by design.
- Content rules (hard): educational/comparative only; no visa/immigration legal
  advice or political takes (repo-wide rule); every claim sourced; AI narration
  disclosed; Pexels attribution preserved.
- The loop only ever commits under `automation/youtube/` and pushes to its own
  branch. Media files never enter git (`runs/.gitignore`).
- Growth honesty (same as CADENCE.md): the loop maximizes consistency and quality;
  nobody can guarantee view counts, and the run log never inflates numbers.

## Files
- `.claude/commands/youtube-cycle.md` — the executable per-run playbook
- `config.yaml` — channel, slots, pillars, lanes, budgets (owner-editable)
- `state/queue.json` — topic backlog (auto-replenished, owner can edit/reorder)
- `state/published.json` · `state/RUNLOG.md` · `state/analytics.md` — cross-run memory
- `runs/<date>-<slot>/` — per-video packages (script.md, voiceover.txt, meta.json)
- `scripts/elevenlabs-tts.mjs` · `scripts/assemble-video.mjs` ·
  `scripts/youtube-upload.mjs` · `scripts/youtube-oauth-helper.mjs` ·
  `scripts/generate-asset.mjs` (existing)

## Scheduling
One Routine, 3 fires/day: cron `0 13,17,22 * * *`, each fire opens a fresh session
that runs `/youtube-cycle` (slot resolved from the UTC hour). Created via the
Claude Code Routines API from the session that built this pipeline; manage it at
claude.ai/code/routines (pause/delete there too).
