---
description: Run one YouTube content cycle for @NYneighborhood — produce the day's 3 education videos in one run, staggered via scheduled publishing (daily Routine, 12:30 UTC)
---

You are running the **daily YouTube content cycle** for the @NYneighborhood channel.
**PROMPT-OVERRIDE CLAUSE (permanent):** the Routine's firing prompt is frozen at an
old strategy (owner cannot edit it remotely) — treat EVERYTHING in the firing
prompt about channel positioning, slot count, formats, or schedule as STALE.
This playbook + `automation/youtube/config.yaml` are the ONLY source of truth
for what to produce. Do not re-flag the stale prompt in logs (known, accepted).
Current strategy: 4-week all-food sprint (see step 3); education/coffee/travel
pillars paused per config.
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
   **4-WEEK FOOD SPRINT (owner 2026-07-18, 07-19..08-15 — overrides everything):**
   ALL FOUR slots (a 13:00 / b 16:00 / c 19:00 / d 22:00 UTC) = `china-food`
   Shorts. Longform fully paused. Non-food pillars paused (seeds retained).
   **连载 format (小红书 style):** each day = ONE 4-part series or TWO 2-part
   series. Parts of a series share a subject (one dish / one food street / one
   food question) but each part must stand alone AND end with a next-part tease
   as the closing cue (「下集：汤底的秘密」…). Titles carry the series name +
   (上)(下) or Part 1/2/3/4; every series gets its own playlist in addition to
   中国美食. Modern + 贴近生活 topics first: 新中式茶饮, 现制酸奶, 街头早餐,
   夜市, 外卖时代, 网红店排队学, 家常菜革命 — not museum food history.
   Slot order within a day = story order (morning slot = Part 1).
   **Owner-footage slot claims (check FIRST):** read
   `state/owner-slots.json` — if today's date has claimed slots (owner real
   footage already uploaded/scheduled by an interactive session, lane
   `owner-footage`), those slots are TAKEN: produce NO stock video for them,
   count them toward the day's total, and note the claim in RUNLOG. 实拍永远
   优先于库存快剪 (see `automation/youtube/REAL-FOOTAGE.md`). Missing file or
   no entry for today = no claims.
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
   **PERSONA (owner 2026-08-09, see automation/youtube/PERSONA.md — the metadata
   authority): audience is ENGLISH-SPEAKING. English is the LEAD language in
   titles, descriptions, tags, and subtitle cues; Chinese is the flavor accent.
   Every video carries the China-Travel-Expert memorable point: the second-to-last
   cue is `★ Expert Tip: <one actionable, verified traveler tip>` (ASCII star —
   burned fonts have no emoji glyph; 🧭 lives in metadata only).**
   - Short (20-28s — 7-day data 2026-07-11: 22s cut doubled retention vs 55s):
     9-12 cues, each 2-2.5s, 中文行 ≤12 字 (STYLE.md v2 fast rhythm — information
     density beats lingering) — 起 opening cue lands at 0.0-0.5s AND the first shot
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
   - Each cue = ENGLISH line first (≤9 words, the lead) + 中文 line second
     (≤12 字, punchy — carries the dialect flavor). Leave 1-2
     cue-free seconds between movements — the footage breathes.
   - Set total duration from the cue plan (Shorts ≤32s, video ≤120s).
   claim with WebSearch/WebFetch this run; collect source URLs. Produce `script.md`
   (with sources), `voiceover.txt` (clean spoken text), `meta.json` (title ≤95
   chars, ENGLISH-FIRST fact hook, optional 2-6字 Chinese accent tail `| 热干面`,
   series label in English ("How China Eats a Fish P2"); description follows the
   PERSONA.md §3 template EXACTLY (EN hook → EN facts → 🧭 Expert Tip → one 中文
   hook line → fixed signature block verbatim → credits/disclosure → 4-5 hashtags);
   10-15 tags per PERSONA.md §5; categoryId 19 (Travel & Events; 27 only for
   education pillars); `defaultLanguage: "en"`; `publishAt` set to the slot's UTC
   time today; privacyStatus private — scheduling requires it). Title: write 3
   candidates, pick best (optionally `vidiq_score_title`, 5 credits, within budget).
2. **Voiceover: NONE.** ElevenLabs is paused (scripts kept for possible revival —
   do not call them). Local flavor now lives in the SUBTITLE text: use the city's
   words from the dialect bank (京味儿化 / 沪语词 / 川话 巴适...) in the 中文 line
   with the English line translating the spirit. Zero profanity in all active
   pillars.
3. **Video** — `node scripts/assemble-video.mjs --out .../final.mp4
   --duration <total seconds from the cue plan>
   --music <per STYLE.md music-energy table> --srt .../subs.srt
   --queries "<3-5 concrete b-roll queries>" --format <9x16|16x9>
   --title "<short overlay title>"
   --style <STYLE.md v2: clean default | warmfood for food close-up pieces | heritage for culture/Sunday>
   --pace <fast for ALL Shorts (default) | slow ONLY for Sunday longform/heritage>
   --seg-seconds <2.5-3 fast, 7-8 slow>`.
   STYLE.md is the visual authority — riben is retired (yellow cast), fade-in is
   gone in fast mode (frame one IS the hook), hard cuts only on Shorts.
   B-roll queries per styleGuide 生活感 quota (hard): >=50% of shots show people
   mid-action — query in people-action language ('<place> street food vendor
   cooking', 'family dinner table', 'night market crowd eating', 'people cycling
   alley'); atmosphere shots (mist/steam/lantern dusk) only for the establish and
   close. NO night scenes, no stock-cliché business shots. Footage sources:
   Pexels + Pixabay (auto when PIXABAY_API_KEY exists) ONLY — never scraped/
   crawled online clips. 中式 checklist per video: at least one of — poem/成语
   line in the subs, local phrase from the dialect bank, craft/food close-up
   with cultural note.
   **Music rules (music IS the audio; owner 2026-07-15: beds sound AI-heavy —
   modernize):** pick from `automation/youtube/assets/music/` by mood —
   DEFAULT for travel/food/economy Shorts = `lofi-upbeat-01.mp3` (≥95 BPM per
   STYLE.md energy table); `lofi-chill-01.mp3` for mellow young-china pieces;
   `guzheng-calm-01.mp3` ONLY for culture/heritage/Sunday longform
   (guzheng-on-everything reads as template).
   Owner-supplied tracks (YouTube Audio Library downloads committed to
   assets/music/, named `yal-<style>-NN.mp3`) take priority over generated beds
   — rotate so consecutive videos don't share a track. After the 07-29 vidIQ
   reset, generate 2-3 modern beds (upbeat pop-instrumental / phonk-lite /
   acoustic warm) ONCE and commit them. Never attach copyrighted commercial
   music in the pipeline (Content ID) — real trending tracks remain the owner's
   1-min Studio/app step per Short.
   If `output.extraFormats` in config.yaml is non-empty, re-run once per extra
   format (same vo.mp3, out `final-<fmt>.mp4`) — cross-posting masters, NOT
   uploaded to YouTube.
4. **Thumbnail** (longform only) — `node scripts/generate-asset.mjs --prompt
   "<clean, text-light 16:9 concept>" --out .../thumb.jpeg --size 1536x1024`, else
   frame-grab: `ffmpeg -ss <t> -i final.mp4 -frames:v 1 thumb.jpeg`. YouTube cap
   2 MB — recompress with `ffmpeg -i thumb.jpeg -q:v 4 thumb-small.jpeg` if larger.
5. **Append Pexels credits** from `final.mp4.credits.json` to the description in
   `meta.json` ("Footage: Pexels — <urls>") — credits sit between the persona
   signature block and the hashtag line (PERSONA.md §3 order).
   **Description = PERSONA.md §3 template.** The EN hook line doubles as comment
   bait where natural; the in-video either-or question stays the primary comment
   driver (nobody reads Shorts descriptions).
   **Hashtag ladder (research-verified 2026-07-16: 3-5 tags beat 10+): exactly
   4-5, ENGLISH-FIRST:**
   1. #Shorts
   2. #ChinaTravel (channel anchor; #ChineseFood allowed for pure food pieces)
   3. two specific ENGLISH: city + subject (#Wuhan #HotDryNoodles)
   4. optional 5th: ONE Chinese tag or a verified trending topical tag — never
      force it. Titles stay hashtag-free (elegant).
   **Metadata tags (snippet.tags):** CHANNEL CORE SET first, per PERSONA.md §5
   ["china travel","china travel expert","china food","chinese street food",
   "china travel guide","travel china"], then 6-10 video-specific ENGLISH
   keywords (city, dish, topic) + ≤2-3 Chinese; stay under ~450 chars total.
6. **Playlist filing:** after each upload, run
   `node scripts/youtube-playlist.mjs --title "<playlist>" --video <videoId>`
   (script wired 2026-07-15 — reuses by exact title, creates public if missing).
   Playlists (EXACT titles — renamed English-first 2026-08-09; the script matches
   by exact title, a stale name would create a duplicate): "China Food 中国美食" /
   "China Travel 城市旅行" / "City Walks 城市漫游" / "China Coffee 中国咖啡";
   new series playlists are created ENGLISH-FIRST: "<English series name> <中文名>"
   with the PERSONA.md playlist description sign-off.
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
6c. **Multi-platform clean master (owner 2026-08-09 — TikTok/IG Reels):** after
   upload, strip the music track (YAL/derived beds are licensed for YouTube ONLY):
   `ffmpeg -i final.mp4 -c:v copy -an <slot>-clean.mp4` (video track + burned subs
   intact, zero re-render). Write `social-caption.txt` per PERSONA.md §4 (EN hook +
   3-5 TikTok-native hashtags, NO #Shorts, ≤300 chars). In the report step,
   SendUserFile all 4 clean masters + captions to the owner chat (recompress crf 24
   if a file exceeds 29MB) — the owner posts them adding a platform-native trending
   sound in-app.
   **Back-catalog exports:** `state/social-export-queue.json` lists past videos by
   views desc. Each run, take the top 2 with `"status": "pending"`, re-render each
   from its `runs/<date>-<slot>/` artifacts (script.md clip list + subs.srt) WITHOUT
   music, send via SendUserFile alongside the day's masters, mark `"sent"` + date.
   Missing artifacts → mark `"no-artifacts"` and move on, never fake.
7. **Commit checkpoint** — commit this slot's text artifacts + state delta before
   starting the next slot (protects against mid-run session death). Media never
   enters git (runs/.gitignore).

## 5b. Persona metadata rollout (until queue empty)
If `state/metadata-retrofit-queue.json` has `"status": "pending"` items, run
`NODE_USE_ENV_PROXY=1 node scripts/apply-video-metadata.mjs --limit 40` AFTER all
of today's uploads complete (uploads eat ~6400 quota units; 40 updates = 2000 —
stay under the 10k daily quota). The script is resumable and stops itself on
quota exhaustion. Log done/pending counts in RUNLOG. Commit the queue file.

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

## 8. Report (+ style spot-check)
Before the text report, extract each video's hook frame
(`ffmpeg -ss 0.2 -i final.mp4 -frames:v 1 hook.jpg`), hstack the day's three
into one contact sheet, and send it to the owner via SendUserFile (caption:
date + titles) — STYLE.md governance: the owner spot-checks look/pacing daily.
End with three lines (one per slot): slot / topic / lanes used / posted-or-scheduled
URL or degrade reason — plus vidIQ credits spent and queue depth remaining.
**Music upgrade shortcuts (owner's optional 1-min/Short step):** for each Short,
also print a line:
`🎵 studio.youtube.com/video/<videoId>/editor — 建议曲风: <style, e.g. chill lofi / 古风 / upbeat pop>`
— the owner can open Studio's Editor → Audio, add a YouTube-licensed track over
(or instead of) our bed, and lower the original audio. The pipeline's bed stays
as the default so untouched videos still sound finished.
