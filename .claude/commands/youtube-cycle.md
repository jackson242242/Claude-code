---
description: Run one YouTube content cycle for @NYneighborhood — produce and post one education video per automation/youtube/PIPELINE.md (fires 3x/day)
---

You are running one **YouTube content cycle** for the @NYneighborhood channel
(education niche: education trends, world colleges, education systems, what's latest).
This is an autonomous routine run in a fresh session: the repo is your only memory.
Read `automation/youtube/PIPELINE.md` and `automation/youtube/config.yaml` first —
they are the source of truth; this file is the executable summary.

**Honesty rules (hard):** never fake a post, never invent analytics, never skip the
state write-back. If a step is blocked, degrade exactly as written below and say so
in the run log. All facts stated in a video script must come from sources found this
run; put the source links in the video description.

## 0. Setup & lane detection
1. `apt-get update && apt-get install -y ffmpeg` (container is fresh each run).
2. Determine the slot: current UTC hour ~13 → slot `a` (Short), ~17 → `b` (longform),
   ~22 → `c` (Short). Off-schedule manual runs default to slot `b`.
3. Detect available lanes (do NOT print secret values):
   - Upload: `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` + `YOUTUBE_REFRESH_TOKEN`
   - Voice: `ELEVENLABS_API_KEY`; Visuals: `PEXELS_API_KEY`; Thumbnail: `OPENAI_API_KEY`
   - Optional: `KLING_ACCESS_KEY`/`KLING_SECRET_KEY`, `COPYAI_API_KEY`, `JASPER_API_KEY`
   - vidIQ MCP tools present? If yes, call `vidiq_balance` once; vidIQ generation is
     allowed only if balance ≥ `budgets.vidiqCreditsFloor` and per-run spend stays
     ≤ `budgets.vidiqCreditsPerRun`.
4. **No voice lane AND no vidIQ voiceover → the video cannot be made.** Do a
   research-only run: replenish the topic queue (step 2), write state back (step 7),
   log `blocked: no voiceover lane`, and stop. Do not fabricate output.

## 1. Read state
`automation/youtube/state/queue.json` (topic backlog), `state/published.json`,
`state/RUNLOG.md` (yesterday's outcomes), `config.yaml` (pillars, rules, budgets).

## 2. Pick topic (+ replenish queue when low)
- Take the top queue item whose `format` matches the slot (Short vs longform).
- If fewer than 5 queue items remain: generate 5-8 new seeds — WebSearch for what is
  current in global education this week; if vidIQ is available and within budget, one
  `vidiq_keyword_research` call to pick stronger phrasing. Every seed needs a dated
  `whyNow` hook and must pass `strategy.contentRules` (no visa/immigration advice,
  no political takes).

## 3. Write the script (Claude-native by default)
- Short: 130-160 spoken words (≤60s), hook in first 2 lines. Longform: 900-1400 words,
  hook → 3-5 sections → recap → CTA (subscribe framing, honest, no clickbait promises).
- Verify every factual claim with WebSearch/WebFetch this run; collect source URLs.
- If `COPYAI_API_KEY`/`JASPER_API_KEY` exist, you may use them per PIPELINE.md §lanes,
  but Claude-native is the default and quality bar either way.
- Produce in `automation/youtube/runs/<YYYY-MM-DD>-<slot>/`:
  `script.md` (with sources), `voiceover.txt` (clean spoken text only), `meta.json`
  (title ≤100 chars, description with sources + AI-narration disclosure + Pexels
  credits placeholder, 10-15 tags, categoryId 27, privacyStatus public).
- Title/desc quality: if vidIQ available and within budget, `vidiq_generate_titles`
  or `vidiq_score_title` (5 credits) to pick the best of your 3 candidates; else pick
  yourself.

## 4. Produce media
1. Voiceover: `node scripts/elevenlabs-tts.mjs --text-file .../voiceover.txt --out .../vo.mp3`
   (fallback: `vidiq_voiceover_generate` within credit budget; save the returned audio).
2. Video: `node scripts/assemble-video.mjs --audio .../vo.mp3 --out .../final.mp4
   --queries "<3-5 concrete b-roll queries from the script>" --format <9x16|16x9>
   --title "<short overlay title>"`. Optional lanes (Kling / vidiq_generate_video)
   only per PIPELINE.md and budget — never for all 3 daily slots.
3. Thumbnail (longform only; Shorts don't need one): `node scripts/generate-asset.mjs
   --prompt "<clean, text-light 16:9 concept>" --out .../thumb.png --size 1536x1024`,
   else grab a strong frame: `ffmpeg -ss <t> -i final.mp4 -frames:v 1 thumb.png`.
4. Append the Pexels credits from `final.mp4.credits.json` to the description in
   `meta.json` ("Footage: Pexels — <urls>").

## 5. Post
- Upload lane available →
  `node scripts/youtube-upload.mjs --video .../final.mp4 --meta .../meta.json [--thumbnail .../thumb.png]`
  Record the returned videoId/URL. If the API reports the video locked private
  (unverified API project), record that honestly — do not claim it is public.
- Upload lane missing → **dry-run**: keep the content package, set
  `"status": "awaiting-upload-credentials"` in `meta.json`, and continue. The text
  artifacts get committed; media stays in the container (runs/.gitignore).

## 6. Analytics pulse (slot `a` only, once a day)
If vidIQ MCP is present: `vidiq_channel_analytics` (channel UCSU99qan7oWIEY-c8uYmuSQ,
last 7 days, views/watch-time/subs by day, 5 credits) → append one summary line to
`state/analytics.md` and, if a pillar clearly outperforms, reorder the queue and say so.
If absent: skip silently (no invented numbers).

## 7. Write state back (never skip)
1. Dequeue the used topic; save replenished queue to `state/queue.json`.
2. Append the posted video (or dry-run entry) to `state/published.json`:
   `{date, slot, title, videoId|null, url|null, pillar, lane, status}`.
3. Prepend one line to `state/RUNLOG.md`: `date slot | topic | lanes | outcome | credits`.
4. Commit everything under `automation/youtube/` (+ nothing else) with message
   `yt-cycle(<date>-<slot>): <topic> — <posted|dry-run|blocked>` and push to the
   current branch (`git push -u origin HEAD`, retry 4x with backoff on network errors).

## 8. Report
End with one line: slot / topic / lanes used / posted URL or degrade reason /
vidIQ credits spent / queue depth remaining.
