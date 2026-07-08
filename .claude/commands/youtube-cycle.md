---
description: Run one YouTube content cycle for @NYneighborhood — produce the day's 3 education videos in one run, staggered via scheduled publishing (daily Routine, 12:30 UTC)
---

You are running the **daily YouTube content cycle** for the @NYneighborhood channel
(education niche: education trends, world colleges, education systems, what's latest).
This is an autonomous routine run in a fresh session: the repo is your only memory.
Read `automation/youtube/PIPELINE.md` and `automation/youtube/config.yaml` first —
they are the source of truth; this file is the executable summary.

**Batch mode (default):** one run produces ALL THREE of today's videos and uploads
them with staggered scheduled publishing:

| Slot | Format | publishAt (UTC) |
|------|--------|-----------------|
| a | Short, 9:16, ≤60s | 13:00 today |
| b | longform, 16:9, 6-10 min | 17:00 today |
| c | Short, 9:16, ≤60s | 22:00 today |

(A manual/test fire may instruct a single slot instead — follow its instructions.)

**Honesty rules (hard):** never fake a post, never invent analytics, never skip the
state write-back. If a step is blocked, degrade exactly as written below and say so
in the run log. All facts stated in a video script must come from sources found this
run; put the source links in the video description.

## 0. Setup & lane detection
1. `apt-get update && apt-get install -y ffmpeg` (container is fresh each run).
   Also `export NODE_USE_ENV_PROXY=1` before any `node scripts/*.mjs` call — Node's
   fetch ignores HTTPS_PROXY without it and API calls die on proxied egress
   (verified 2026-07-08; harmless when no proxy is configured).
2. Detect available lanes (do NOT print secret values):
   - Upload: `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` + `YOUTUBE_REFRESH_TOKEN`
   - Voice: `ELEVENLABS_API_KEY`; Visuals: `PEXELS_API_KEY`; Thumbnail: `OPENAI_API_KEY`
   - vidIQ MCP tools present? If yes, call `vidiq_balance` once; vidIQ generation is
     allowed only if balance ≥ `budgets.vidiqCreditsFloor` and per-run spend stays
     ≤ `budgets.vidiqCreditsPerRun`.
3. **No voice lane AND no vidIQ voiceover → videos cannot be made.** Do a
   research-only run: replenish the topic queue (step 2), write state back (step 6),
   log `blocked: no voiceover lane`, and stop. Do not fabricate output.

## 1. Read state
`automation/youtube/state/queue.json` (topic backlog), `state/published.json`,
`state/RUNLOG.md` (yesterday's outcomes), `config.yaml` (pillars, rules, budgets).

## 2. Pick today's 3 topics (+ replenish queue when low)
- Slot a: top queue item with `format: short`; slot b: top `format: longform`;
  slot c: next `format: short`.
- If fewer than 5 queue items remain after taking 3: generate 5-8 new seeds —
  WebSearch for what is current in global education this week; if vidIQ is available
  and within budget, one `vidiq_keyword_research` call to pick stronger phrasing.
  Every seed needs a dated `whyNow` hook and must pass `strategy.contentRules`
  (no visa/immigration advice, no political takes).

## 3-5. Produce each video (loop slots a → b → c)
For each slot, work in `automation/youtube/runs/<YYYY-MM-DD>-<slot>/`:

1. **Script** — Short: 130-160 spoken words, hook in first 2 lines. Longform:
   900-1400 words, hook → 3-5 sections → recap → honest CTA. Verify every factual
   claim with WebSearch/WebFetch this run; collect source URLs. Produce `script.md`
   (with sources), `voiceover.txt` (clean spoken text), `meta.json` (title ≤100
   chars; description with sources + AI-narration disclosure + credits placeholder;
   10-15 tags; categoryId 27; `publishAt` set to the slot's UTC time today;
   privacyStatus private — scheduling requires it). Title: write 3 candidates, pick
   best (optionally `vidiq_score_title`, 5 credits, within budget).
2. **Voiceover** — `node scripts/elevenlabs-tts.mjs --text-file .../voiceover.txt
   --out .../vo.mp3` (fallback: `vidiq_voiceover_generate` within credit budget).
3. **Video** — `node scripts/assemble-video.mjs --audio .../vo.mp3 --out .../final.mp4
   --queries "<3-5 concrete b-roll queries from the script>" --format <9x16|16x9>
   --title "<short overlay title>"`. If `output.extraFormats` in config.yaml is
   non-empty, re-run once per extra format (same vo.mp3, out `final-<fmt>.mp4`) —
   cross-posting masters, NOT uploaded to YouTube.
4. **Thumbnail** (longform only) — `node scripts/generate-asset.mjs --prompt
   "<clean, text-light 16:9 concept>" --out .../thumb.jpeg --size 1536x1024`, else
   frame-grab: `ffmpeg -ss <t> -i final.mp4 -frames:v 1 thumb.jpeg`. YouTube cap
   2 MB — recompress with `ffmpeg -i thumb.jpeg -q:v 4 thumb-small.jpeg` if larger.
5. **Append Pexels credits** from `final.mp4.credits.json` to the description in
   `meta.json` ("Footage: Pexels — <urls>").
6. **Upload** — if the upload lane is available:
   `node scripts/youtube-upload.mjs --video .../final.mp4 --meta .../meta.json
   [--thumbnail .../thumb.jpeg]`
   - `publishAt` in the past by the time you upload (overrun)? Remove it and set
     privacyStatus public (immediate publish) — note the change in the run log.
   - If the API leaves the video locked private (unverified project), record that
     honestly — do not claim it is public/scheduled.
   - Upload lane missing → **dry-run**: keep the package, set
     `"status": "awaiting-upload-credentials"` in `meta.json`, continue.
7. **Commit checkpoint** — commit this slot's text artifacts + state delta before
   starting the next slot (protects against mid-run session death). Media never
   enters git (runs/.gitignore).

## 6. Analytics pulse (once per run)
If vidIQ MCP is present: `vidiq_channel_analytics` (channel UCSU99qan7oWIEY-c8uYmuSQ,
last 7 days, 5 credits) → append one summary line to `state/analytics.md`; if a
pillar clearly outperforms, reorder the queue and say so. If absent: skip silently.

## 7. Write state back (never skip)
1. Dequeue the 3 used topics; save replenished queue to `state/queue.json`.
2. Append each video (or dry-run entry) to `state/published.json`:
   `{date, slot, title, videoId|null, url|null, pillar, lane, status, publishAt}`.
3. Prepend one line per slot to `state/RUNLOG.md`:
   `date slot | topic | lanes | outcome | credits`.
4. Final commit of everything under `automation/youtube/` (+ nothing else), message
   `yt-cycle(<date>): 3 videos — <posted|scheduled|dry-run|blocked>` and push to
   `claude/youtube-automation-workflow-v8egf3`
   (`git push -u origin claude/youtube-automation-workflow-v8egf3`, retry 4x with
   backoff on network errors).

## 8. Report
End with three lines (one per slot): slot / topic / lanes used / posted-or-scheduled
URL or degrade reason — plus vidIQ credits spent and queue depth remaining.
