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

| Requested | Official API? | In this pipeline | Notes (verified 2026-07-08) |
|---|---|---|---|
| Claude / GetPoppy (ideas & scripts) | Claude: yes (this session) · Poppy: yes, text-only (Power User plan ~$760/yr) | ✅ **Claude native** — ideation, scripting, fact-checking | Poppy's API only repurposes existing content into text; Claude covers this at zero extra cost. |
| copy.ai (YT scripts) | Workflows API — gated to Growth plan (**$1,000/mo minimum**) | 🔌 Optional lane via `COPYAI_API_KEY` | Headless-legal, but the price gate makes it pointless unless you already pay for Growth. |
| jasper.ai (YT content) | API on Business plans ($900+/mo) — but **ToS prohibits automated access** beyond human-rate requests | ❌ Not wired — ToS friction + price | Claude covers scripts at zero marginal cost. |
| nichesss (niches & ideas) | API exists, but ToS bans "automated systems" (ambiguous, unverifiable — ToS page 403s) | ✅ Replaced: vidIQ `keyword_research` + `trending_videos` + Claude | Not worth the ToS ambiguity. |
| "SM suite" viral idea finder | No identifiable product/API under that name | ✅ Replaced: vidIQ `outliers`/`trending_videos` (MCP, connected) | If you meant a specific tool, tell us; Virlo (pay-as-you-go trend API, $5 min) is a clean optional add-on. |
| invideo.io (text-to-video) | API exists (docs.invideo.io, credit-based) but ToS vaguely bans "bots/automated tools" | ✅ Replaced: **Pexels b-roll + ffmpeg** (`scripts/assemble-video.mjs`) | Our lane is free, headless, and ToS-clean. |
| kling.ai (video gen) | Yes — official API (JWT via access+secret key, ~$0.075/sec, $9.80 min prepaid); also via fal.ai/Replicate with simpler billing | ⏸ **Paused by owner (2026-07-08)** — adapter ready (`scripts/kling-video.mjs`); re-add `kling` to `providers.visuals` in config.yaml + supply keys to resume | Paid per-generation; use for hero videos, not 3x/day. fal.ai is the lower-friction route if resumed. |
| elevenlabs (voiceover) | Yes (`api.elevenlabs.io`, xi-api-key header; models incl. eleven_v3 / multilingual_v2) | ✅ Primary voice lane (`scripts/elevenlabs-tts.mjs`, `ELEVENLABS_API_KEY`) | ⚠️ **Free tier prohibits commercial use / monetized YouTube.** Starter $5/mo is the legal minimum; ~$14/mo covers 3 videos/day. Fallback: vidIQ voiceover (credits). |
| vidIQ (analytics) | ✅ MCP server connected to this workspace | ✅ Analytics + keyword research + title scoring (+ generation fallbacks) | Account: 150 credits/mo — the loop budgets ≤10/run, floor 40 (see config.yaml). |
| Midjourney (cover design) | **No official API**; Discord automation violates their ToS | ❌ Not automated — replaced by OpenAI Images (`scripts/generate-asset.mjs`) or vidIQ thumbnail gen | We don't do ToS-violating automation. |
| Canva (thumbnails) | Connect API exists; the Canva MCP connector needs owner OAuth | 🔌 Available after you authorize Canva in claude.ai connector settings | Headless routine runs may not carry the connector; primary lane is OpenAI Images. |
| YouTube posting | YouTube Data API v3 | ✅ `scripts/youtube-upload.mjs` (resumable upload, scheduling, thumbnails) | See quota + audit caveats below. |

**YouTube caveats (important, honest):**
- Quota: historically `videos.insert` cost 1,600 units of a 10,000/day pool; Google's
  newer quota model reportedly caps uploads at ~100 calls/day instead. Under either
  model, 3 uploads/day fits comfortably. Thumbnails: JPEG/PNG ≤ 2 MB.
- **New/unverified Google Cloud projects get API uploads locked private** until the
  project passes YouTube's API compliance audit (community reports: approval can take
  months — apply early, form is linked from the API console). Until then the loop
  still uploads (private) and records the real status; flip each video public in
  Studio (~30 seconds/day) as the interim path.
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
  `scripts/kling-video.mjs` (optional hero-shot lane) ·
  `scripts/generate-asset.mjs` (existing)

## Scheduling
One Routine, 3 fires/day: cron `0 13,17,22 * * *`, each fire opens a fresh session
that runs `/youtube-cycle` (slot resolved from the UTC hour). Created via the
Claude Code Routines API from the session that built this pipeline; manage it at
claude.ai/code/routines (pause/delete there too).
