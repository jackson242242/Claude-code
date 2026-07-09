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
| a | Short, 9:16, ≤30s | 13:00 today |
| b | video, 16:9, ≤2 min | 17:00 today |
| c | Short, 9:16, ≤30s | 22:00 today |

(A manual/test fire may instruct a single slot instead — follow its instructions.)

**Honesty rules (hard):** never fake a post, never invent analytics, never skip the
state write-back. If a step is blocked, degrade exactly as written below and say so
in the run log. All facts stated in a video script must come from sources found this
run; put the source links in the video description.

## 0. Setup & lane detection
1. `apt-get update && apt-get install -y ffmpeg fonts-noto-cjk` (container is fresh
   each run; the CJK font is required for burned-in Chinese subtitles).
   Also `export NODE_USE_ENV_PROXY=1` before any `node scripts/*.mjs` call — Node's
   fetch ignores HTTPS_PROXY without it and API calls die on proxied egress
   (verified 2026-07-08; harmless when no proxy is configured).
2. Detect available lanes (do NOT print secret values):
   - Upload: `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` + `YOUTUBE_REFRESH_TOKEN`
   - Voice: `ELEVENLABS_API_KEY`; Visuals: `PEXELS_API_KEY`; Thumbnail: `OPENAI_API_KEY`
   - vidIQ MCP tools present? If yes, call `vidiq_balance` once; vidIQ generation is
     allowed only if balance ≥ `budgets.vidiqCreditsFloor` and per-run spend stays
     ≤ `budgets.vidiqCreditsPerRun`.
3. **ElevenLabs quota self-check (every run):** if `ELEVENLABS_API_KEY` is set,
   `curl -s https://api.elevenlabs.io/v1/user/subscription -H "xi-api-key: $ELEVENLABS_API_KEY"`
   → log tier + `character_count`/`character_limit` (remaining chars) in RUNLOG.
   A full batch needs ~2.6k chars (2 Shorts ~420 each + video ~1.7k). If remaining
   is short: produce what fits — priority slot a Short → slot c Short → longform
   last — skip the rest with an honest log line, and put a LOW-QUOTA warning at the
   top of the final report so the owner sees it.
4. **No voice lane AND no vidIQ voiceover → videos cannot be made.** Do a
   research-only run: replenish the topic queue (step 2), write state back (step 6),
   log `blocked: no voiceover lane`, and stop. Do not fabricate output.

## 1. Read state
`automation/youtube/state/queue.json` (topic backlog), `state/published.json`,
`state/RUNLOG.md` (yesterday's outcomes), `config.yaml` (pillars, rules, budgets).
**Idempotency guard:** if `published.json` already has 3 entries for TODAY (UTC)
and this fire carries no explicit override instructions, today's batch is done —
log `skipped: batch already published today` and stop. (Protects against manual
"Run now" double-posting.)

## 2. Daily direction research + pick today's 3 topics
1. **Direction research (every run, ~5 min, free):** 2-3 WebSearch passes on
   (a) what education stories people are actually discussing this week (Reddit
   r/ApplyingToCollege / r/Professors / education press), (b) fresh dated hooks.
   Write 2-4 lines of findings into `state/research.md` (newest first): what
   resonates, which angles feel tired, any queue topic that now looks stale.
   **Plus dialect-bank deepening (1 WebSearch, free):** pick the least-recently
   updated region in `state/dialect-bank.md` (11 regions, header lists them),
   search its current internet 梗/流行语, append 1-3 verified entries in the
   file's format (mark 敏感度 honestly; skip anything political or
   group-targeting). All three test lines pull from this bank.
2. **vidIQ rotation (budget-capped, see budgets):** Mon & Thu add the analytics
   pulse (step 6); Sat add ONE `vidiq_trending_videos` or `vidiq_outliers` call
   (education niche) and note in research.md which formats/angles over-perform.
   Skip all vidIQ when balance < floor.
3. **Pick slots:** slot a = top queue education `format: short`; slot b = top
   education `longform` — each must pass `strategy.topicFitGate` (everyday-life
   relevance + beautiful b-roll potential + rules). A topic that fails the gate is
   either re-angled on the spot (note it) or moved to the bottom with a `fitNote`,
   taking the next candidate.
   **Slot c = TEST SLOT (config `testLines`):** UTC day-of-month % 3 →
   0 = `cantonese-comedy`, 1 = `china-travel`, 2 = `teach-chinese-dialects`.
   Take the top queue item with that pillar; if none, generate one from today's
   research + `state/dialect-bank.md`; if the line is blocked (e.g. Cantonese
   voice unavailable), rotate to the next line; if all blocked, fall back to an
   education short and log why.
4. **Replenish:** if fewer than 5 items remain after taking 3, generate 5-8 new
   seeds from today's research findings. Every seed needs a dated `whyNow` hook,
   must pass the topicFitGate and `strategy.contentRules` (no visa/immigration
   advice, no political takes), and should honor `strategy.styleGuide` in its
   angle (lived experience over institution-speak).

## 3-5. Produce each video (loop slots a → b → c)
For each slot, work in `automation/youtube/runs/<YYYY-MM-DD>-<slot>/`:

1. **Script** — Short: 65-80 spoken words (≤30s), hook in the first line. Video
   (slot b): 260-300 words (≤2 min), hook → 2-3 tight sections → one-line recap →
   honest CTA. Voice model: `eleven_multilingual_v2` (standard quality — owner
   choice; do not switch to flash). Verify every factual
   claim with WebSearch/WebFetch this run; collect source URLs. Produce `script.md`
   (with sources), `voiceover.txt` (clean spoken text), `meta.json` (title ≤100
   chars; description with sources + AI-narration disclosure + credits placeholder;
   10-15 tags; categoryId 27; `publishAt` set to the slot's UTC time today;
   privacyStatus private — scheduling requires it). Title: write 3 candidates, pick
   best (optionally `vidiq_score_title`, 5 credits, within budget).
2. **Voiceover** — `node scripts/elevenlabs-tts.mjs --text-file .../voiceover.txt
   --out .../vo.mp3` (fallback: `vidiq_voiceover_generate` within credit budget).
   **Test-line voice rules (config `testLines`):**
   - `cantonese-comedy`: pass `--model eleven_v3` and write the voiceover text in
     colloquial 广东话 (口语字: 係/唔/嘅/咗). Pick a voice that carries comedy
     timing. If the API rejects eleven_v3 or the output is not real Cantonese,
     SKIP the slot honestly (never pass Mandarin off as Cantonese). Profanity
     (owner-approved raw, THIS line only): real 粤语粗口 allowed in spoken audio +
     burned subs; titles/descriptions/tags/thumbnails MUST stay 100% clean; EN
     subtitle line may soften with asterisks. Education and china-travel lines:
     zero profanity, no exceptions.
   - `china-travel`: follow `dialectLadder` top-down; label the actual language in
     the on-screen intro + description (e.g. 「普通话·京味」). Never fake a dialect.
     Weave 1-2 clean entries from `state/dialect-bank.md` for the spot's region
     into the script (hook or closing wink).
   - `teach-chinese-dialects`: pick one bank entry (clean only), teach it 3x
     (slow → natural → mini-scene). Voice per config voiceRules: 粤语 via
     eleven_v3; other dialects = Mandarin narrator teaching, dialect text big
     on screen, honest on-screen label of what the audio is.
   **Subtitles (both test lines):** write `subs.srt` in the run folder — one cue
   per sentence, timed proportionally to character count over the vo.mp3 duration
   (ffprobe), each cue = local-language line + English line. Pass `--srt` in step 3.
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

## 6. Analytics pulse (Mon & Thu only — credit budget)
If vidIQ MCP is present AND today is Monday or Thursday (UTC):
`vidiq_channel_analytics` (channel UCSU99qan7oWIEY-c8uYmuSQ, last 7 days, 5 credits)
→ append one summary line to `state/analytics.md`; if a pillar or style clearly
outperforms, reorder the queue and say so in research.md. Other days / absent: skip
silently. (~15 credits/week total with the Sat trend call — sustainable within the
150/month cap.)

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
