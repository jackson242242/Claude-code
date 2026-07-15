---
description: Run one YouTube content cycle for @NYneighborhood — produce the day's 3 education videos in one run, staggered via scheduled publishing (daily Routine, 12:30 UTC)
---

You are running the **daily YouTube content cycle** for the @NYneighborhood channel.
**CHANNEL PIVOT 2026-07-09 (owner directive):** education content is PAUSED — ignore
any "education channel" phrasing in the firing prompt. The channel now covers CHINA:
Shorts = city tourism & food; longform = culture & 城市漫游 city walks. Aesthetic =
日系唯美 pacing/look with 中式文化底蕴 (see config styleGuide).
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
   each run; the CJK font is required for burned-in Chinese subtitles). The 书法
   title font ships IN THE REPO (`automation/youtube/assets/fonts/
   MaShanZheng-Regular.ttf`, OFL) — assemble-video finds it automatically when
   run from the repo root; no download needed (github.com is proxy-blocked in
   routine sessions, verified 2026-07-10).
   Also `export NODE_USE_ENV_PROXY=1` before any `node scripts/*.mjs` call — Node's
   fetch ignores HTTPS_PROXY without it and API calls die on proxied egress
   (verified 2026-07-08; harmless when no proxy is configured).
2. Detect available lanes (do NOT print secret values):
   - Upload: `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` + `YOUTUBE_REFRESH_TOKEN`
   - Voice: `ELEVENLABS_API_KEY`; Visuals: `PEXELS_API_KEY`; Thumbnail: `OPENAI_API_KEY`
   - vidIQ MCP tools present? If yes, call `vidiq_balance` once; vidIQ generation is
     allowed only if balance ≥ `budgets.vidiqCreditsFloor` and per-run spend stays
     ≤ `budgets.vidiqCreditsPerRun`.
3. **Voiceover lanes are PAUSED (owner 2026-07-10)** — videos are subtitle-driven
   with a music main track. Do not call ElevenLabs or vidIQ voiceover; no quota
   check needed. The only hard requirement to make videos is `PEXELS_API_KEY` —
   if it's missing, do a research-only run (replenish queue, write state back,
   log `blocked: no footage lane`) and stop. Do not fabricate output.

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
3. **Pick slots:**
   **Theme-week override (config `strategy.themeWeeks`):** if today falls in a
   theme week (weekStartUtc Monday through Sunday), ALL slots draw from that
   theme's pillar (topics tagged `pillar: <theme>`); replenishment (step 4)
   generates within-theme. Formats unchanged (a/c Short, b longform). If the
   theme queue is empty and research can't fill it, fall back to general pillars
   and log why.
   **General mapping (non-theme days, day = UTC day-of-month; owner decision
   2026-07-15 — slot b longform is SUNDAY-ONLY, weekdays it's a third Short):**
   - slot a (Short): odd day `city-travel`, even day `china-food`
   - slot b weekdays (Short): odd day `china-culture`, even day `china-coffee`
   - slot b Sunday (longform ≤2min): odd day `city-walk`, even day `china-culture`
   - slot c (Short): the opposite of slot a
   During theme weeks all slots draw from the theme; slot b still follows the
   Sunday-longform rule.
   Take the top queue item with that pillar (skip items whose pillar is in
   `pausedPillars`); if none, generate one from today's research +
   `state/dialect-bank.md`. Each pick must pass `strategy.topicFitGate`
   (everyday-life relevance + beautiful b-roll potential + rules); fail → re-angle
   on the spot or defer with a `fitNote`.
   Every travel/food/culture video weaves 1-2 clean local phrases/梗 from
   `state/dialect-bank.md` for its city's region (hook or closing wink), and
   follows the dialect ladder for narration flavor (honest labeling, never fake).
4. **Replenish:** if fewer than 5 items remain after taking 3, generate 5-8 new
   seeds from today's research findings. Every seed needs a dated `whyNow` hook,
   must pass the topicFitGate and `strategy.contentRules` (no visa/immigration
   advice, no political takes), and should honor `strategy.styleGuide` in its
   angle (lived experience over institution-speak).

## 3-5. Produce each video (loop slots a → b → c)
For each slot, work in `automation/youtube/runs/<YYYY-MM-DD>-<slot>/`:

1. **Subtitle script (NO VOICEOVER — owner directive 2026-07-10):** the video
   speaks through burned bilingual subtitles + music. Write `subs.srt` directly
   as the narrative, structured per 起承转合:
   - Short (20-28s — 7-day data 2026-07-11: 22s cut doubled retention vs 55s):
     7-8 cues, each 2.5-4s — 起 opening cue lands at 0.0-0.5s AND the first shot
     is the single most striking clip (steam/water/light — never an establishing
     wide); the first cue poses a curiosity gap the last cue answers → 承 2-3
     development beats → 转 the surprise/taste/discovery → 合 a closing line that
     LOOPS back to the opening (rewatches push view% past 100 — the Shorts
     algorithm's strongest signal). Final cue alternates between a soft CTA
     (「关注，带你去下一座城 / Follow for the next city」) and a direct either-or
     question ON SCREEN (「你会先加糖还是先闻香？评论区见」) — 07-15 data: likes
     arrived but comments are still 0; nobody reads Shorts descriptions, the
     question must live in the video.
   - **Fact-first hooks beat place-first hooks (07-15 data):** 云南98%咖啡 (836
     views/2d) and 漓江¥20纸币 (840/4d) broke into wave-2; 北京胡同 (148) and
     永康路 (242) with place-name openers lagged. Open every Short with the
     surprising NUMBER/FACT, not the place name — re-angle queue titles at pick
     time accordingly.
   - Video (slot b, 90-120s): 22-30 cues in four movements (establish → walk +
     history beat → food/discovery twist → dusk reflection). One 成语 or poem
     line per video.
   - Each cue = 中文 line (≤16 字, punchy) + English line (≤9 words). Leave 1-2
     cue-free seconds between movements — the footage breathes.
   - Set total duration from the cue plan (Shorts ≤32s, video ≤120s).
   Verify every factual
   claim with WebSearch/WebFetch this run; collect source URLs. Produce `script.md`
   (with sources), `voiceover.txt` (clean spoken text), `meta.json` (title ≤100
   chars; description with sources + AI-narration disclosure + credits placeholder;
   10-15 tags; categoryId 27; `publishAt` set to the slot's UTC time today;
   privacyStatus private — scheduling requires it). Title: write 3 candidates, pick
   best (optionally `vidiq_score_title`, 5 credits, within budget).
2. **Voiceover: NONE.** ElevenLabs is paused (scripts kept for possible revival —
   do not call them). Local flavor now lives in the SUBTITLE text: use the city's
   words from the dialect bank (京味儿化 / 沪语词 / 川话 巴适...) in the 中文 line
   with the English line translating the spirit. Zero profanity in all active
   pillars.
3. **Video** — `node scripts/assemble-video.mjs --out .../final.mp4
   --duration <total seconds from the cue plan>
   --music <see music rules below> --srt .../subs.srt
   --queries "<3-5 concrete b-roll queries>" --format <9x16|16x9>
   --title "<short overlay title>" --style riben
   --seg-seconds <7 for Shorts, 8 for longform>`.
   (No --audio: subtitle-driven mode — music is the full-presence main track.)
   B-roll queries per styleGuide 生活感 quota (hard): >=50% of shots show people
   mid-action — query in people-action language ('<place> street food vendor
   cooking', 'family dinner table', 'night market crowd eating', 'people cycling
   alley'); atmosphere shots (mist/steam/lantern dusk) only for the establish and
   close. NO night scenes, no stock-cliché business shots. Footage sources:
   Pexels + Pixabay (auto when PIXABAY_API_KEY exists) ONLY — never scraped/
   crawled online clips. 中式 checklist per video: at least one of — poem/成语
   line in the subs, local phrase from the dialect bank, craft/food close-up
   with cultural note.
   **Music rules (music IS the audio now):** pick from
   `automation/youtube/assets/music/` by mood — `guzheng-calm-01.mp3` for serene
   travel/culture/city-walk, `lofi-chill-01.mp3` for food/young-china/upbeat
   spots. Do NOT regenerate via vidIQ per run (25 credits). Trend alignment: the
   Saturday vidIQ trend scan notes which music STYLES dominate top Shorts —
   record in research.md; when a needed style is missing from assets/, flag it
   in the report for the owner (real trending commercial tracks are only usable
   via the YouTube app's Shorts remix — manual, owner-side — never attach
   copyrighted music in the pipeline).
   If `output.extraFormats` in config.yaml is non-empty, re-run once per extra
   format (same vo.mp3, out `final-<fmt>.mp4`) — cross-posting masters, NOT
   uploaded to YouTube.
4. **Thumbnail** (longform only) — `node scripts/generate-asset.mjs --prompt
   "<clean, text-light 16:9 concept>" --out .../thumb.jpeg --size 1536x1024`, else
   frame-grab: `ffmpeg -ss <t> -i final.mp4 -frames:v 1 thumb.jpeg`. YouTube cap
   2 MB — recompress with `ffmpeg -i thumb.jpeg -q:v 4 thumb-small.jpeg` if larger.
5. **Append Pexels credits** from `final.mp4.credits.json` to the description in
   `meta.json` ("Footage: Pexels — <urls>").
   **Description engagement format:** first line = ONE genuine question to the
   viewer (comment bait, honest — e.g. 「你会先烫毛肚还是黄喉？」); then the
   bilingual summary; hashtags at the end: #shorts (Shorts only) #china + city
   and topic tags (≤6 total).
6. **Playlist filing:** after each upload, run
   `node scripts/youtube-playlist.mjs --title "<playlist>" --video <videoId>`
   (script wired 2026-07-15 — reuses by exact title, creates public if missing).
   Playlists: 中国美食 China Food / 城市旅行 China Travel / 城市漫游 City Walks /
   中国文化 Chinese Culture, plus one per theme week (e.g. 中国咖啡 China Coffee).
   Backfill note: on first use, also file this week's earlier theme videos (see
   published.json) so the shelf isn't a single video.
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
**Music upgrade shortcuts (owner's optional 1-min/Short step):** for each Short,
also print a line:
`🎵 studio.youtube.com/video/<videoId>/editor — 建议曲风: <style, e.g. chill lofi / 古风 / upbeat pop>`
— the owner can open Studio's Editor → Audio, add a YouTube-licensed track over
(or instead of) our bed, and lower the original audio. The pipeline's bed stays
as the default so untouched videos still sound finished.
