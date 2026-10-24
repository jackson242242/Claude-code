---
description: Run one YouTube content cycle for China Travel Expert (UCSU99qan7oWIEY-c8uYmuSQ) — 3 Shorts/day (a/c/d) + a longform every other Friday, made in one run and staggered via scheduled publishing (daily Routine, 12:30 UTC)
---

You are running the **daily YouTube content cycle** for the China Travel Expert channel
(UCSU99qan7oWIEY-c8uYmuSQ): 3 Shorts/day (slots a/c/d) + a longform every other Friday.
**PROMPT-OVERRIDE CLAUSE (permanent):** the Routine's firing prompt is frozen at an
old strategy (owner cannot edit it remotely) — treat EVERYTHING in the firing
prompt about channel positioning, slot count, formats, or schedule as STALE.
This playbook + `automation/youtube/config.yaml` are the ONLY source of truth
for what to produce. Do not re-flag the stale prompt in logs (known, accepted).
Current strategy: **§0c POV 8-WEEK PLAN (2026-10-19..12-13)** inside the
NATURE-FIRST direction (§2.3); owner-facing copy: `automation/youtube/plans/pov-8week.md`.
This is an autonomous routine run in a fresh session: the repo is your only memory.
Read `automation/youtube/PIPELINE.md` and `automation/youtube/config.yaml` first —
they are the source of truth; this file is the executable summary.

**Batch mode (default):** one run produces ALL of today's Shorts (3; 2 on a
ship-2 day, see §0c) and uploads them with staggered scheduled publishing (times
tuned for the EU/US audience, owner 2026-08-10; config.yaml `cadence.slots` is
authoritative; slot b was retired 2026-08-15):

| Slot | Format | publishAt (UTC) | audience moment |
|------|--------|-----------------|-----------------|
| a | Short, 9:16 (format per §0c rotation) | 13:00 today | 9am ET / EU afternoon |
| c | Short, 9:16 (format per §0c rotation) | 20:00 today | 4pm ET / 9-10pm EU prime |
| d | Short, 9:16 (format per §0c rotation) | 23:00 today | 7pm ET US evening prime |
| L | Longform 16:9, every other Friday (§4L) | 15:00 that Friday | EU evening / US morning |

(A manual/test fire may instruct a single slot instead — follow its instructions.)

**Honesty rules (hard):** never fake a post, never invent analytics, never skip the
state write-back. If a step is blocked, degrade exactly as written below and say so
in the run log. All facts stated in a video script must come from sources found this
run; put the source links in the video description.

## 0. Setup & lane detection
1. `apt-get update && apt-get install -y ffmpeg fonts-noto-cjk` (container is fresh
   each run; the CJK font is required for burned-in Chinese subtitles). ALSO
   `python3 -m pip install cairosvg pillow numpy` (PyPI is reachable; needed by the
   M lane renderers in `scripts/mechanism/`; ~20 s). If pip fails, log
   `M-lane: BLOCKED (cairosvg)` and run that day's M slot as F4. The 书法
   title font ships IN THE REPO (`automation/youtube/assets/fonts/
   MaShanZheng-Regular.ttf`, OFL) — assemble-video finds it automatically when
   run from the repo root; no download needed (github.com is proxy-blocked in
   routine sessions, verified 2026-07-10).
   Also `export NODE_USE_ENV_PROXY=1` before any `node scripts/*.mjs` call — Node's
   fetch ignores HTTPS_PROXY without it and API calls die on proxied egress
   (verified 2026-07-08; harmless when no proxy is configured).
2. Detect available lanes (do NOT print secret values):
   - Upload: `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` + `YOUTUBE_REFRESH_TOKEN`
   - Voice (longform only, §4L): `ELEVENLABS_API_KEY` while paid credits last;
     `OPENAI_API_KEY` for `scripts/tts-openai.mjs` only if config `longform.voice` is
     "openai". Visuals: `PEXELS_API_KEY`; Thumbnail: `OPENAI_API_KEY`
   - vidIQ MCP tools present? If yes, call `vidiq_balance` once; vidIQ generation is
     allowed only if balance ≥ `budgets.vidiqCreditsFloor` and per-run spend stays
     ≤ `budgets.vidiqCreditsPerRun`.
3. **Shorts have NO voiceover (owner 2026-07-10)** — subtitle-driven with music
   and, for POV formats, the clip's own ambient sound (§0c). Never call vidIQ
   voiceover (removed from config 2026-10-17: it spends credits toward the floor
   of 40). ElevenLabs is called only for §4L narration. The hard requirement for
   stock formats is `PEXELS_API_KEY` — if it's missing, still make any F1 owner
   recut that is due (§0c), otherwise do a research-only run (replenish queue,
   write state back, log `blocked: no footage lane`) and stop. Do not fabricate output.
4. **Music vault (decision 2026-10-17, D2):** the ElevenLabs music beds are stored
   ENCRYPTED in `automation/youtube/assets/music-vault/*.mp3.enc` because the repo
   is public. Decrypt them at the start of every run:
   `node scripts/music-vault.mjs decrypt --all` (key derived from
   `YOUTUBE_CLIENT_ID`; never print it). The plain `el-*.mp3` files it writes into
   `assets/music/` are git-ignored: never `git add -f` them, never send or copy them
   anywhere. If the script or the vault folder is missing, or decrypt exits non-zero
   (2 = variable missing, 3 = tag check failed), log `music-vault: <reason>` once,
   say so in the report and continue with the plain beds in `assets/music/` (the 9
   legacy beds are always there) — never stop the day for it. Vault workflow and new
   tracks: MUSIC.md §4.

## 0b. DAILY SELF-CORRECTION LOOP (owner 2026-09-02 — execute, don't report)
0. **HOOK LEARNING LOOP (owner 2026-09-20, HARD):** BEFORE writing any cue 1,
   read `automation/youtube/HOOKS.md` — its 铁律 1-7, template bank A-G, and the
   AUTO block. The AUTO line **`今日三槽依次用（a / c / d）`** is an ASSIGNMENT,
   not a menu: slot a takes the first type, c the second, d the third (swap
   order only when a slot's format forces it, and say so in RUNLOG). Types
   marked 补样本 MUST be shipped until they reach 3 samples — that is the only
   way the loop learns (audit 2026-09-21..26: 16 of 22 hooks were number-only
   SPECTACLE/PLAIN-FACT, discussion types stayed at n=1-2, nothing was learned).
   SPECTACLE-FACT and PLAIN-FACT are NOT hook types — the number goes INSIDE a
   discussion hook (铁律 3). Hard cap: ≤1 non-discussion hook per day, only for
   a slot-d route superlative, ≤3 per week; the AUTO block prints the quota used
   and the run must respect it. Every Short's cue 1 must be discussion-worthy:
   the viewer can DISAGREE, must CHOOSE, or gets a belief OVERTURNED — a fact
   they merely learn does not qualify. **Format overrides (2026-10-17, §0c):** a
   slot the rotation gives to F3 always uses PRICE-SHOCK; an F1 owner recut uses
   the `hookType` stored for it in `plans/owner-recuts.json`; the AUTO types then
   fill the remaining slots in a/c/d order (log the swap). "POV:" and
   "Would you…?" hooks only on F1/F2 (HOOKS.md 铁律 6). The AUTO block's
   "已验证 (≥3)" / "避免" labels are advisory until hook-ledger.mjs implements
   铁律 6 (deferred): call a type proven or avoid only with n≥6 clean equal-age
   samples. AFTER all uploads, run
   `NODE_USE_ENV_PROXY=1 node scripts/hook-ledger.mjs --days 30` and commit the
   updated HOOKS.md; log each slot's hook TYPE in RUNLOG (`hook:<TYPE>`), and
   mark novel shapes `HOOK-NEW:<desc>`.
1. `NODE_USE_ENV_PROXY=1 node scripts/yt-postmortem.mjs` → read
   `state/postmortem.md` top block BEFORE picking topics. Since 2026-10-17 the
   script also appends view snapshots to `state/view-snapshots.json` (commit it)
   and prints an EQUAL-AGE section (48 h / 72 h ±6 h; "~" = interpolated).
   **Verdict rules (2026-10-17, replaces "replicate WINNER / drop LOSER"):**
   - Format decisions use the §0c same-day pairs only.
   - Hook verdicts use equal age (48 h / 72 h ±6 h) against BOTH the trailing-28-day
     same-age median and the fixed 2026-09-15..09-30 same-age median. The fixed
     baseline needs per-day views of the September Shorts (YouTube Analytics API);
     while that API answers 403, say `baseline-B: unavailable` and judge against
     the trailing median only. Ignore samples the postmortem marks LOW-REACH DAY
     (an exogenous control-cohort flag; not printed yet — Slice 3 — so until then
     no sample is excluded). Never call a hook proven or avoid on fewer than 6
     clean samples. The script's per-video WINNER/LOSER words (a 14-day median of
     Shorts ≥3 d old, unequal ages) are context, not verdicts.
   - If the postmortem prints DISTRIBUTION ANOMALY (≥3 consecutive Shorts <15
     views at 48 h; Slice 3) — or you see that pattern in the EQUAL-AGE section
     yourself — the report's first line is `check Studio`.
   One line in RUNLOG: "postmortem: <equal-age readings + hook verdicts>".
2. **Every other Monday (odd ISO weeks; 2026-10-19 is ISO week 43):**
   `node scripts/yt-competitor-scan.mjs` (~1,000 quota units; query set
   includes nature/mountain/desert/village) → read `state/competitors.md` as a
   **survivorship sample: shapes to test, not rules** — it only shows the
   survivors. Ignore re-upload / fair-use channels when reading it: Wow!, Banana
   Loves Traveling, Crazy Junction, Fact Drift, NeuroVerse, Kindred Notes (the
   script-side EXCLUDE set is deferred). Never copy content; a "Would you…?"
   shape goes only to F1/F2. If the file is older than 15 days on any other day,
   run it anyway (it once went unrun 09-02..09-26).
3. After each upload: `node scripts/youtube-comment.mjs --video <id> --text
   "<the video's either-or question + ★ Expert Tip>"` — seeds the first comment.
   **Still BLOCKED (checked 2026-10-16: tokeninfo = `youtube` + `youtube.upload`,
   no `youtube.force-ssl`).** It unblocks when the owner re-mints the token with
   `node scripts/youtube-oauth-helper.mjs --scopes
   youtube,youtube.upload,youtube.force-ssl,yt-analytics.readonly` (run on the
   owner's own machine; the helper prints the consent-screen checklist — it must
   be "In production" or the token expires in 7 days) and replaces
   YOUTUBE_REFRESH_TOKEN. Probe once per run with tokeninfo; if force-ssl is
   absent log `comment-seed: BLOCKED (no force-ssl)` once and do not retry per
   slot. Once unblocked: reply to every viewer comment found via
   commentThreads.list (comments.insert) — tiny volume, strong signal.
4. **Mondays from 2026-10-26 — POV library top-up:** add ≥4 newly verified
   clips to `automation/youtube/assets/pov-library.json`. Find candidates with
   `NODE_USE_ENV_PROXY=1 node scripts/pexels-probe.mjs "<pov query>" ...` (POV
   words + China place names, e.g. "pov walking dali", "train window china",
   "cable car ride china"; the probe is portrait-only with 8 results, so also run
   the landscape request from §4L — most library clips are landscape); keep only clips whose slug names a Chinese place or
   that show clear Chinese signage. Download the small rendition, grab 3 frames
   at 15/50/85 % (`ffmpeg -ss <t> -i clip.mp4 -frames:v 1 f<n>.jpg`), LOOK at them
   with the Read tool, and add a clip only if the frames show forward motion at
   eye level (walk / ride / train window / steps). Copy an existing entry's field
   shape exactly (`placeSpeakable` from the slug only; `verifiedBy` = what you
   checked); add a non-city clip's id to `readFilters.nonCity.ids` only when it
   shows no city. Log `pov-supply: +N (total M, unused non-city K)`; N<4 is
   reported, never padded. (The Slice-3 port of the probe tools is not built yet.)
5. **One-off on 2026-10-19:** create the English playlist "China POV Walks &
   Rides" and backfill 4 owner Shorts: `node scripts/youtube-playlist.mjs
   --title "China POV Walks & Rides" --video <id>` for O3MPquBKc-g, ZzQ08vquF0U,
   dRsAeXT2OnE, fGWdBwp3Ros (4 calls, the first creates the playlist ≈ 250 units).
   NOT f8f7Ftl-8HI (ep4: a child's face fills the frame at 6.7-8.2 s, a man's face
   in close-up at 13.5-17.9 s) or h-6tu1E19j4 (ep5: children's faces at
   1.75-2.75 s; mostly a restaurant and an unconfirmed lantern hall): they go on
   the 10-24 Saturday OWNER STUDIO list as "owner decides (child face close-up)"
   (§8). From then on file every F1/F2 Short into it. No Chinese in this
   playlist's title.

## 0c. POV 8-WEEK PLAN (2026-10-19..12-13; review 12-17)
**Outside the window:** a run BEFORE 2026-10-19 (e.g. Sat 10-17, Sun 10-18) uses
no rotation and no F1/F2: every slot is F4, except slot a on a Wednesday or Sunday
= F3 China Price Check (so 10-18 = a F3, c F4, d F4). The frame-0 check (0c.3), the
aerial cap, the audio table (0c.1), the words rules (0c.4), the length bands and
the meta/state fields (0c.7) already apply to those runs. A run AFTER 2026-12-13
keeps the rotation, gates and W8 freeze unchanged (no new variables, still no
verdicts) until an interactive session updates config `pov8w`; 12-17 adds the
review report only. Compute every day count with a non-negative mod:
`((d % 3) + 3) % 3`.
Owner complaint 2026-10-17: every Short was aerial/drone, none felt first-person.
This section decides each slot's FORMAT, footage and audio. Where it conflicts with
the §2.3 NATURE-FIRST slot subjects it wins (the subjects still fill F4 and the F3
pricing). The hook loop (§0b.0), the FOOTAGE-FIRST gate, the honesty rules,
English-only subtitles, no commercial music and no politics all stay. Machine-readable
copy: config `pov8w`; owner-facing plan: `plans/pov-8week.md`.
**Decisions (owner delegated everything on 2026-10-19: 「都没有时间做，都交给你」 —
never wait for or ask the owner; run on these values):** `pov8w.cityScope` = approved
for HERITAGE subjects (see ARCHITECTURE-FIRST in §2.3); longform voice = ElevenLabs
Rachel while the Starter plan's credits last, then "none"; AI inserts = off; title
suffix kept. Synthetic-flag backfill of old videos = PARTIAL 35/326 (an accidental test
run on 10-17 13:13Z, accurate — all use AI beds; record in
`state/synthetic-flag-queue.json`); on 10-19 `--apply` was denied by the session
permission classifier, so the routine NEVER attempts it. Only an interactive session
changes these values in config; the routine reads them every run.
**Subject of every slot from 2026-10-19 = Chinese ancient architecture** (§2.3
ARCHITECTURE-FIRST). Read "NATURE-FIRST subjects" below as "ARCHITECTURE-FIRST
subjects" wherever §0c mentions them.

**0c.1 Formats**
| Fmt | What | Length (F2/F4 = test band through 11-16) | Frame 0 | Footage | Words |
|---|---|---|---|---|---|
| F1 | Owner POV: recuts from `plans/owner-recuts.json` now, raw originals later | 13-18 s | the motion itself (toboggan, chairlift, window, alley walk, hands paying/eating) | `runs/owner-footage/` only | first person allowed |
| F2 | "Ride It / Walk It": licensed first-person POV, one place, one ride or walk | 14-20 s | forward first-person motion | `assets/pov-library.json` via `--clips` | second person only |
| F3 | China Price Check (Wed + Sun) | 15-22 s | price card or the owner's receipt/POV | slug-named ground clip of the priced place, or MAP-FORMAT | second person |
| F4 | Ground-level nature / small town — the baseline arm | 14-20 s | human-scale ground shot (path, village lane, boat, people at a viewpoint) | slug-verified Pexels video, Ken-Burns photos, MAP-FORMAT fallback | second person |
| L | 6-9 min search guide, every other Friday (§4L) | 6-9 min | answer-first | ≥3 min slug-named non-aerial | no "I" over stock |
| **M** | **Mechanism explainer Short (ROAD-TO-1M 2026-10-23, `plans/road-to-1m.md`): code-drawn SVG animation of HOW a building works (dougong, hidden floors, rammed earth, drainage…), 3-4 labelled steps, then 3 s of a slug-named real photo/clip of the site** | 30-60 s (NOT the 14-20 s band) | hook card: big number + the building drawing itself | `scripts/mechanism/render_*.py` → `--clips` with a `file:` entry + the site photo; NO stock in the steps, NO AI imagery | second person; every caption number from `plans/architecture-facts.md` or the seed's 2 sources |
**M lane rules:** takes the X slot on Mon/Tue/Fri/Sat (X = M instead of F4; Wed/Sun F3 and Thu
F1 unchanged, so the F2/F4 same-day pair is intact). Seeds: queue `arch-M-*` (each names its
renderer or scene JSON; a seed without a renderer yet = write one from `render_pagoda.py`
primitives, ≤25 agent-min, else run the slot as F4 and log `M: no renderer`). Bed from the
vault; `containsSyntheticMedia` stays true (AI bed, D1) — never claim "no AI label". Audit:
render → `frame0-sheet` → LOOK (labels never overlap the drawing; nothing below y=1260 where
subtitles sit) → upload with `fmt:M`, `footage:diagram`. Log `M-sample: <n>` so the Stage 0
gate (≥6 clean samples; M 72 h median ≥1.5× same-day F4 and ≥1 M ≥2,000 views by 11-23) can
be read by the Sunday manager session. First seed arch-M-01 (Yingxian) is pre-rendered by
`python3 -I scripts/mechanism/render_pagoda.py <outdir>` (~30 s) with
`plans/mechanism/yingxian/short-subs.srt` and `short-clips.json` (fix the file: path to
the rendered mp4).
F3 keeps the Q4 rules (one comparison, both sides verified THIS RUN, both in USD,
≥4× gap, something the viewer pays for, 2 dated sources in the description). Price
card = cue 1 shows both prices big in the middle of the frame over a ground clip whose
slug names the place of the priced item, or over MAP-FORMAT; the US side is text only.
No generic "item being priced" clip (massage room, coaster, cable car) unless its slug
names a Chinese place — probe the item with `scripts/pexels-probe.mjs` first.
F4 = today's NATURE-FIRST DEBATE/STAKES Short with a ground-level frame 0 and one
distinct verified fact per Short (so a run of them does not read as templated).
**Audio per format** (summary — `MUSIC.md` §5 is the authority, §6 the credit lines,
§7 the rotation):
| Fmt | Bed (first choice → fallback when el-*/wc-* are not in `assets/music/`) | Gain |
|---|---|---|
| F1 | el-acoustic-journey-01 / wc "Acoustic Meditation", "Second Nature" → guzheng-calm-01 (from 17 s) | ambient first, music ≤0.3; recuts whose audio was replaced: 0.85 |
| F2 | el-pov-walk-groove-01 / wc "Travel Light", "Cool Steel Breeze" → lofi-chill-01 | clip audio kept: music 0.3-0.4 (`--keep-audio 0.6 --music-volume 0.35`); silent clip: 0.6-0.7 |
| F3 | el-street-funk-01, el-hype-pluck-01 → cpop-groove-01 | 0.6-0.7 |
| F4 | el-mountain-calm-01 / wc "Green Leaves", "Paper Wings" → guzheng-calm-01 | 0.6-0.8 |
| L | el-docu-underscore-04/05 / wc "Solo Acoustic #3" → underscore-docu-01..03 | under VO / text |
No EDM drop, no heavy-drum bed and no SFX pop on F1/F2 (`--sfx none`):
oriental-edm-01/02, cinema-orient-01, cinema-reveal-02 and silk-road-drums-01 are for
F3/F4 only. Use a bed only if its file is in `assets/music/` this run (el-* appear
after the vault decrypt; wc-* only once the Commons download has been ingested).

**0c.2 Daily rotation (deterministic — do not improvise)**
`d = UTC date − 2026-10-19 in days`; `idx = ((d % 3) + 3) % 3` (never negative;
only used from 10-19 on); base = `[F2, F4, X]`;
slot a/c/d = `base[(0+idx) mod 3]`, `base[(1+idx) mod 3]`, `base[(2+idx) mod 3]`.
X = F3 on Wed + Sun, F1 on Thu, **M on Mon/Tue/Fri/Sat (from 2026-10-24; was F4 —
ROAD-TO-1M)**. F1/M take whichever slot X lands in (no fixed slot d). A slot claimed in `state/owner-slots.json` with a
videoId overrides the rotation (log it as F1). L is extra on its Fridays (15:00Z), not a slot.
First week (the pattern repeats every 3 weeks):
| Day | a | c | d |
|---|---|---|---|
| Mon 10-19 | F2 | F4 | F4 |
| Tue 10-20 | F4 | F4 | F2 |
| Wed 10-21 | F3 | F2 | F4 |
| Thu 10-22 | F2 | F4 | F1 (R-01) |
| Fri 10-23 | F4 | F4 | F2 (+ L #1) |
| Sat 10-24 | F4 | F2 | F4 |
| Sun 10-25 | F2 | F4 | F3 |
Then apply the gates in 0c.3, which can turn an F2 or F1 slot into F4. Log every
slot as `fmt:<X>` and, when a gate changed it, `fmt:F4 (F2→F4: <gate>)`.

**0c.3 Gates**
- **F2 activation:** F2 needs `scripts/assemble-video.mjs --clips`. On the first run
  with F2 in the rotation: `node --check scripts/assemble-video.mjs`, render the F2
  Short, make its frame-0 sheet and look at it. All three pass → log
  `f2-gate: PASS` once in RUNLOG; later runs skip this when RUNLOG has the line. Any
  failure → that F2 slot runs as F4 and you log `f2-gate: FAIL <reason>`; retry next run.
- **City scope (`pov8w.cityScope`):** approved → every F2 slot runs F2 (half street POV
  with people doing things, `povType: street`; half rides and trails). pending or
  denied → F2 runs at most 2 a week, on Monday's and Thursday's F2 slots, from the
  non-city subset only: `node scripts/pov-library.mjs list --usable --china --no-city`
  (the library's `readFilters.nonCity.ids` is the authority; e.g. as of 10-17:
  px-39312225 = "Great Wall" only, never a section name; px-40310034 and px-40303779 =
  Dali; px-39975778 = Guangxi; wm-c02/wm-c03 = "D-train" only, no route or place).
  Every other F2 slot runs as F4.
  **Used clips:** every clips.json entry keeps the `libraryId` that
  `pov-library.mjs --json` prints (px-… / wm-c…; the assembler ignores extra fields),
  and every run commits its `<run>/clips.json` (§7). A clip is used once
  `grep -lF '"<libraryId>"' automation/youtube/runs/*/clips.json` finds it (the
  quotes stop wm-c01 matching wm-c010; no match, or no clips.json yet = unused).
  Never pick a used clip for another F2. Among
  unused clips take first those whose numeric Pexels id is not in any
  `runs/*/meta.json` (`grep -lF '<number>' automation/youtube/runs/*/meta.json`; as
  of 10-17 only px-39312225 is, in 4 stock Shorts 09-09..09-25). Do not count by
  meta.json or credits.json alone: meta.json holds Pexels page URLs, not px- ids, a
  Commons title is URL-encoded there, and `*.mp4.credits.json` is git-ignored.
  When no unused non-city clip is left, log `F2 paused: supply-out (not a loss)` and
  run F4.
- **Frame-0 check (every Short and every L, from 10-19):** after render run
  `node scripts/frame0-sheet.mjs --video <run>/final.mp4 --out <run>/frame0.jpg` and
  LOOK at the sheet with the Read tool before uploading (frames 0.0 s / 0.5 s / 1.0 s
  / mid / end−1 s). Pass = frame 0 is not an aerial or drone view; F1/F2 show forward
  first-person motion (0.0/0.5/1.0 differ); F4 a human-scale ground shot; F3 the price
  card or the owner's receipt. Fail → re-render ONCE with a ground-first opening (with
  `--clips`: put a ground clip first; in query mode: make the first query ground-level,
  e.g. "<place> village lane walking", "<place> boat river", "<place> viewpoint
  people"). Still aerial → open on MAP-FORMAT or a ground photo (`--photos fill` with a
  ground photo first). Neither honest → ship 2 Shorts that day. Log
  `frame0: PASS | RERENDER | MAP | PHOTO | DROP`.
- **Aerial cap:** at most 1 aerial/drone shot per Short, never at 0 s. Check the run's
  `final.mp4.credits.json`: count sourceUrl slugs containing aerial, drone, bird-s-eye,
  top-view, overhead or from-above; more than 1 → re-render without the extras.
- **Ship 2, not 3,** when a slot has no honest footage or fails frame 0 twice — log
  `dropped: <slot> <reason>`. Never fill a slot with a dishonest video.
- **Never delete or re-upload a published Short** to "fix" its reach.
- **AI footage:** off (D4). If the owner ever turns it on: not a named place, ≤20 % of
  the runtime, `meta.aiFootage: true` (the uploader then sets the AI label).

**0c.4 Words (hard)**
- Over licensed or stock footage write second person only ("you", "POV: you…").
  First person (I / my / we / Follow me / My first stop / I'd come back) only over
  owner footage (F1). The fixed brand line "I'm your China Travel Expert" stays: it
  is the channel's identity, not a travel claim.
- "POV:" and "Would you…?" titles and hooks only over F1/F2 first-person footage.
- Say a place only over clips whose source slug or Commons title names it (library
  `placeSpeakable`; owner clips: `owner-recuts.json` labels). Write each caption from
  that clip's `verifyNote` and `mood`; never add speeds, routes, step counts,
  distances or scenery that the frames — or a source covering that exact clip or
  place — do not support. Owner-clip times (e.g. "5 am") come from file metadata only.
- Series endings: an F1/F2 Short whose next POV is already scheduled ends with
  `Next POV: <place>. Follow so you don't miss it.` and puts its either-or question
  on the cue before; every other Short ends with the either-or question.
- Stills: plain Ken-Burns is fine. `--photo-motion pov` (forward walk-in on a real
  photo) only as a 3-4 s bridge between real clips, only on photos with a path,
  stairs or alley ahead; never at frame 0, never counted as POV footage
  (`footage: photo`), never under a "POV:" title, never captioned as walked.

**0c.5 Making each format**
- **F2:** write the cue plan and `subs.srt` first; its total length T (14-20 s,
  0c.1) is the Short's length. `node scripts/pov-library.mjs list --usable --china
  [--no-city] --json --seconds <T> > <run>/library.json` → pick ONE place: one
  window of one unused clip, or 2-5 unused entries of that place → write
  `<run>/clips.json` with those entries' `id`, `libraryId`, `in`, `out`, `label`
  (= placeSpeakable, omit when null), optional `cx` and `mute`.
  **Length rule:** `--json` prints 4-second windows by default and the assembler
  makes a `--clips` render exactly as long as the sum of the windows when no
  `--duration` is given (a 4 s window under a 16 s srt gave a 4.0 s Short with the
  subtitles cut off). So set the windows (`--seconds <T>`, or edit `in`/`out`) until
  the sum of (out − in) is ≥ T (hard cuts, the default fast pace), and always pass
  `--duration <T>`. A clip shorter than T needs a second entry of the same place
  (px-40310034 gives at most 12.8 s: add px-40303779, also Dali), a shorter cue plan
  inside the band (px-39312225 gives at most 18.8 s), or a different place for this
  Short — never two places in one F2. A
  `WARN: --clips total … cycling the list` line means the windows are too short:
  re-pick, never upload a render that cycled. After the render the `Wrote … (<N>s`
  line must show N = T (±0.1 s).
  Render: `node scripts/assemble-video.mjs --clips <run>/clips.json --duration <T>
  --fit auto --keep-audio 0.6 --music <F2 bed> --music-volume 0.35 --sfx none --srt
  <run>/subs.srt --format 9x16 --title "<overlay>" --badge "CHINA TRAVEL EXPERT"
  --out <run>/final.mp4`.
  Landscape sources: alternate `--fit crop` (entries with `cx`, or `pov-library.mjs
  … --crop`) and `--fit frame` on alternate F2 days through 11-01 and log `fit:<crop|frame>`.
- **Ambient sound:** you cannot hear the clips, so keep source audio only on rides,
  trails, train windows and steps; street, market, shop, mall and temple-fair clips
  get `--keep-audio 0 --music-volume 0.65` (a shop speaker or busker is a Content ID
  risk). Most Pexels files have no audio track at all. The assembler prints
  `ambient: full | partial | none (…)` after each `--keep-audio` render: `none` → it
  has already raised the music to 0.65 itself (log `ambient:none`); `partial` → the
  silent part has music at 0.35 only, so re-render with `--music-volume 0.5`; `full`
  → keep. Known music ranges go into the entry's `mute`. A Content ID claim on a kept
  track → log it and use `--keep-audio 0` for that clip from then on.
- **F4 / F3:** query mode as in §3 (POV words from `styleGuide`, never aerial/drone
  words), or — once `f2-gate: PASS` — `--clips` with chosen slug-verified ids so the
  ground clip at frame 0 is picked, not searched.
- **F1:** see 0c.6.

**0c.6 Owner POV recut queue (F1, Thursdays)**
Each Thursday the X slot takes one recut from `plans/owner-recuts.json`:
`python3 -I scripts/owner-recut.py --id <R-NN> --out <run>/final.mp4 [--music <bed>]`
(it writes `final.mp4.credits.json` and `final.mp4.recut.json` with meta hints; it
refuses face ranges, wrong place labels and non-ready recuts by itself). Claim the
slot in `state/owner-slots.json` only AFTER the upload succeeded, as
`{"<date>": {"<slot>": {"videoId": "<id>", "title": "<title>"}}}` like the existing
entries — a claim made before the upload would make a re-fire skip the slot (§1)
and lose the recut if the run died in between.
- 10-22: **R-01** on a calm bed — `--music el-acoustic-journey-01.mp3` when that file is
  in `assets/music/` after the vault decrypt and has a manifest entry; otherwise the
  plan default (guzheng-calm-01 from 17 s). Never the old oriental-edm-01 drop.
- cityScope approved: 10-29 R-02, 11-05 R-03, 11-12 R-07, 11-19 R-04. Not approved
  (the default): 10-29 R-04, then pause until raw originals arrive (the X slot runs F4).
- If owner-recut.py warns that the scheduled recut reuses an owner shot published in
  the last 8 weeks (R-07 after R-02 does), take the next ready recut that does not
  warn; none → the slot runs F4.
- Never publish both of a pair (R-01/R-08, R-02/R-06); never name editB; the editA
  spire is "Shanghai" only. The face ranges (ep4 6.7-8.2 s and 13.5-17.9 s; ep5
  1.75-2.75 s) are never used.
- Stop recuts after 3 consecutive recuts whose same-day ratio vs F4 is <1.0 and whose
  averageViewPercentage is not above F4 (the novelty is used up).
- Raw originals (REAL-FOOTAGE.md intake): `node scripts/prep-owner-clip.mjs` (audio
  kept) → F1 at 2-3 a week (Thursday X plus 1-2 F4 slots; F4 keeps ≥1 slot a day);
  raw-original F1 is not judged before 6 samples.

**0c.7 Upload metadata and state (contract C3, C11)**
- Every `meta.json` carries `"music"`: the bed file name(s) actually used (string or
  array; `"none"` if no music) and `"aiFootage": false` (true only for realistic AI
  footage). The uploader sets `status.containsSyntheticMedia` itself: true for any
  AI-generated bed (the 9 legacy beds and every el-* bed), for AI footage, for an
  unknown or missing `music` (fail-safe); human-made wc-*/yal-* beds alone → false.
  It refuses `aiFootage: true` with `containsSyntheticMedia: false`. Never write
  `containsSyntheticMedia: false` to avoid the label. Copy its
  `containsSyntheticMedia=<bool>` line into RUNLOG as `synthetic:<bool>`.
- Description credit lines per MUSIC.md §6 (every AI bed says "AI-generated");
  Commons footage → its attribution string from the library / credits.json.
- `state/published.json` entries gain: `format` (F1|F2|F3|F4|L), `footage`
  (owner|licensed-pov|ground|photo|map|ai-insert — the source of most of the runtime),
  `povType` (walk|ride|street|none), `owner` (true/false), `aspect` ("9x16"/"16x9" —
  the value older entries keep in `format`; never rewrite old entries) and `music`
  (same as meta.music; the synthetic-flag backfill reads it).
- RUNLOG slot lines add `fmt:<X> footage:<…> frame0:<…> synthetic:<…>`.

**0c.8 Weekly rhythm**
Mon: library top-up (from 10-26, §0b.4); competitor scan in odd ISO weeks (§0b.2).
Wed: F3; footage audit for the next guide on 10-21, 11-04, 11-18, 12-02 (§4L).
Thu: F1 recut (0c.6). Fri: F2/F4 + L on 10-23, 11-06, 11-20, 12-04 + SOCIAL PACK (§8).
Sat: OWNER STUDIO checklist (§8). Sun: F3 + the format table (§8).
- W2 (10-26..11-01): 2 MAP-FORMAT retests — 10-27 and 10-31, each day's first F4 slot
  (October's "MAP/CHOICE weakest" verdict came from trough days). Both <0.5× the
  same-day F4 → MAP only inside longform from then on.
- W4 (11-09..15): reallocate only if cityScope is approved and the verdict is not flat:
  the winner gets up to 2 slots a day (supply permitting), F4 keeps ≥1.
- W5 (11-16..22): inside the winner, alternate 12-15 s and 20-25 s days (length test).
- W6 (11-23..29): fixed neutral series name "Ride It: <place>" ("Walked" only for owner
  footage), each with its own verified fact.
- W7 (11-30..12-06): winter / Chinese New Year topics in the winning format, only for
  places with slug-named footage or photos; F4 keeps ≥1 a day.
- W8 (12-07..13): freeze — no new variables. 12-17: review (report only).

**0c.9 Verdicts and kill rules (no day is excluded)**
- Pairs: for each day that has F2 and F4, r = F2 72 h views ÷ median F4 72 h views of
  the same day (same for F1 and F3). 72 h values come from the postmortem EQUAL-AGE
  section; until the script prints the paired table (Slice 3), compute it in the run
  from that section + published.json `format`.
- 11-02: directional only. 11-09 (latest 11-16): a verdict only if cityScope is
  approved and there are ≥12 paired days.
  Win: median r ≥1.3 and averageViewPercentage no more than 3 points below F4, or any
  F2 ≥2,000 views → F2 up to 2 slots a day. Lose: median r ≤0.8 and
  averageViewPercentage not higher → F2 only as longform child Shorts. Flat (0.8-1.3):
  keep the split (the owner asked for POV; equal is no reason to cut it). Analytics
  API still off on 11-09 → judge on r alone and label the verdict `views-only`.
- cityScope not approved: no F2 verdict, no reallocation; report the ratios as directional.
- Subscribers per 1k engaged views: one pooled channel number, never per format
  (about 1 expected subscriber per arm at this scale).
- F1 recuts: the stop rule in 0c.6. F3: 6 consecutive episodes with r <0.8 → pause F3
  (its slots run F4); any F3 ≥4× the same-day F4 → copy that shape for the next 2
  episodes. F4 is never cut. L: §4L kill check.
- Week-4 rule (11-16): if every format's 72 h median is ≤70, the report's first line is
  `CHANNEL-LEVEL: check Studio`; drop to the best 2 Shorts a day and put the effort into
  owner footage and guides.
- Checkpoints to report as met / not met (checks, never promises):
  11-02 — same-age 72 h median ≥80; on ≥4 of 7 days every new Short gets ≥100 Shorts-feed
  views (API off: channel daily views ≥500); like rate ≥0.6 %; ≥3 new subscribers since
  10-17; median F2/F4 r ≥1.0 (directional).
  11-16 — 72 h median ≥120 and the best format ≥170; ≥1 Short ≥2,000 views; total
  subscribers ≥78; pooled subs per 1k engaged views ≥2.5; guide #1 ≥100 views at 14 days
  with Search ≥50 %.

## 1. Read state
`automation/youtube/state/queue.json` (topic backlog), `state/published.json`,
`state/RUNLOG.md` (yesterday's outcomes), `config.yaml` (pillars, rules, budgets).
**Idempotency guard:** if `published.json` already has an entry for every slot
scheduled TODAY (UTC) — a slot claimed in `state/owner-slots.json` with a non-null
`videoId` counts (a claim without a videoId means "in progress": produce it), and on a
ship-2 day a slot that RUNLOG logs as `dropped:` counts — and this fire carries no
explicit override instructions, today's batch is done — log `skipped: batch already
published today` and stop. (Protects against manual "Run now" double-posting.)

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
   **POV 8-WEEK PLAN first (2026-10-19..12-13):** §0c decides each slot's FORMAT
   (F1-F4) and footage; the ARCHITECTURE-FIRST subjects below fill every slot.
   Where they conflict, §0c wins.
   **ARCHITECTURE-FIRST ERA (owner 2026-10-19 — supersedes the NATURE-FIRST
   subjects; formats, hooks, gates and audio unchanged):** 「接下来都做介绍中国的古建筑，
   寺庙，不同的塔，宫殿，城墙等等」. EVERY slot introduces one piece of Chinese
   ancient architecture: temples (Buddhist / Taoist / Confucian / Tibetan), pagodas
   by style (pavilion-style louge, dense-eave miyan, lama stupa / white dagoba,
   diamond-throne, flower pagoda, iron / glazed, leaning), palaces, city walls and
   gates, drum and bell towers, ancient bridges, tulou and ancestral halls, cliff
   temples and grottoes. One building, one number, one argument (HOOKS.md types).
   Heritage sites inside big cities are IN (Forbidden City, Temple of Heaven, Xi'an
   wall, Nanjing wall, Lingyin); modern skylines and city life stay OUT.
   - **Formats:** F1 = owner recuts (all heritage: Mutianyu, Temple of Heaven, White
     Stupa Temple, Summer Palace); F2 = licensed POV at heritage sites (cityScope
     approved — pov-library entries at temples / palaces / walls / old streets);
     F3 (Wed + Sun) = heritage China Price Check (a Chinese heritage ticket or
     experience vs a Western heritage ticket, both verified this run, USD, honest
     multiple); F4 = ground-level heritage Short; L = heritage trip-planning
     search guide (exact query, e.g. "Forbidden City tickets 2026").
   - **Queue:** take `arch-*` seeds first (status active, by priority, each with a
     verified footage lane, hookType, hook, angle and sources). Nature seeds are
     `paused-arch-2026-10-19`. Series seeds keep their EP order.
   - **Footage truth table:** `plans/architecture-pivot.md` (which sites have
     slug-verified ground / POV video, photos only, or nothing). Pexels is full of
     Japanese, Korean, Vietnamese, Thai and Taiwanese temples and pagodas: a site
     name may be spoken ONLY over a clip or photo whose slug names that site;
     generic "Chinese temple" material only with type-level words and only when
     the slug or signage shows it is in China. Frame 0 never aerial.
   - **Facts:** dates, heights, counts and prices are re-verified THIS RUN against
     2 sources (the seed's sources are a starting point, not a pass). Myths are
     framed as MISCONCEPTION only when the correction is sourced. Tibet sites:
     architecture and visiting only, no political framing.
   **NATURE-FIRST ERA (owner 2026-09-26 — SUBJECTS PAUSED 2026-10-19; kept for reference; supersedes the CULTURE-FIRST /
   GROWTH-V2 slot SUBJECTS below; the Q4 PLAN formats, SHORTS v3, HOOK v4 and
   the hook loop still apply):** 「转一下方向去小城市，不再是去大城市；去山里、
   沙漠里、风景很好的地方，什么地貌、特别的自然风光」. The persona now maps
   China's LANDFORMS, WILD SCENERY and SMALL TOWNS. Big cities (Beijing /
   Shanghai / Guangzhou / Shenzhen / Chongqing / Hangzhou / Chengdu / Xi'an /
   Nanjing / Wuhan / Suzhou…) are never the subject — only a departure point
   ("one hour from Shanghai") or a price contrast. Bible: `plans/nature-pivot.md`.
   - **a 13:00 = `china-nature`** — one landform or place, one number, one
     argument (danxia, karst, dunes, salt flats, terraces, gorges, sacred
     peaks, alpine lakes, grasslands). Wed + Sun stay 《China Price Check》 but
     priced around nature trips (park ticket + cable car vs a Western park;
     Antelope Canyon tour vs Danxia gate; Yosemite $35 vs Zhangjiajie $32 —
     honest even when China is NOT cheaper). Fri stays Expert Opinions =
     DEBATE-native ("skip Huangshan at sunrise", overrated/underrated peaks).
   - **c 20:00 = 《China Trip Planner》 2-3×/wk** with nature-intent queries
     ("how to get to Zhangjiajie from Shanghai", "Guilin or Zhangjiajie for
     first-timers", "best month for Zhangye Danxia"); other days **`small-town`**
     (Dali, Yangshuo, Shaxi, Fenghuang, Langzhong, Miao/Tibetan villages, water
     towns). Hot springs / food stay welcome ONLY when set in a small town or
     a mountain valley (Tengchong, Changbai) — never a big-city spa or duck.
   - **d 23:00 = `china-route`** unchanged — it is already the nature slot and
     the channel's best lane (561 km sky road ×3.52, Tarim 446 km, QG loop).
   - `china-culture` ≤1/wk and only inside a landscape or small town (cliff
     carvings, mountain monasteries, village crafts); no standalone craft cards
     or big-city heritage cards (this week's LOSERs: tea ×0.30, jade ×0.45).
   - Queue: `nat-*` seeds lead (each has hookType + hook + verified footage
     lane); big-city seeds are `paused-bigcity-2026-09-26` (prevStatus kept).
   **NATURE FOOTAGE — measured 2026-09-26 (plans/nature-pivot.md §2 truth table):**
   Pexels VIDEO has slug-verified clips for only ~8 places: Zhangye Danxia
   (query "zhangye danxia", 19/20), Guilin / Yangshuo / Li River karst
   ("yangshuo karst", "guilin li river", "china karst mountains"), Chaka salt
   lake, Hukou waterfall, Leshan Giant Buddha, Zhujiajiao water town (query
   "wuzhen water town" returns Zhujiajiao — claim Zhujiajiao), Dali old town,
   Three Gorges / Yangtze. The 09-25/26 runs dropped Danxia and Guilin as
   "FAILED site-ID" because they queried "Zhangye" alone — use the exact
   queries in the table. Pexels PHOTOS cover ~25 more (Zhangjiajie 29/30,
   Huangshan, Jiuzhaigou, Tianmen, Qinghai Lake, Xijiang Miao, Changbai,
   Mount Hua, Yuanyang/Longji, Enshi, Stone Forest…): render them with
   `assemble-video.mjs --photos fill|only` (Ken-Burns stills; photo page URLs
   go to credits.json so the slug gate is identical). Rice-terrace VIDEO is
   Vietnam/Thailand — never say Yuanyang over it. A site name may be spoken
   ONLY over clips/photos whose slug names that site; everything else is
   type-level wording or MAP-FORMAT. No honest footage AND no number = not a
   video; pick the next nat-* seed.
   **CULTURE-FIRST ERA (owner 2026-08-09 — supersedes the food sprint, which
   ended early on 08-09; slot SUBJECTS superseded by NATURE-FIRST above):** the China-Travel-Expert persona
   is built on 中国古文化产物 — the architecture, history, and traditional customs
   that make China UNLIKE anywhere else — not on food volume. Slot mix:
   **GROWTH-V2 (owner 2026-08-15, plans/growth-v2.md — 3 slots/day, b RETIRED):**
   - a 13:00 = china-culture; **Fridays = "Expert Opinions" format** (rankings /
     overrated-underrated / tourists' top mistakes — opinions clearly labeled as
     the expert's own judgment, facts still verified; comment-native by design).
   - c 20:00 = city-travel heritage; **2×/week (Thu & Sun) = food OR
     leisure/hot-springs (owner 2026-08-22: "发食物和游玩温泉之类的" — food
     Shorts welcome again here; 温泉/泡汤/spa/leisure experiences enter the
     rotation, autumn-winter is hot-spring prime time)**; **2×/week (Tue & Sat)
     = "China Practical"**
     search-intent explainers (tourist payment apps, train booking, taxi apps,
     daily budget, cash vs card — planning-stage viewers are the premium
     audience; visa topics = official facts only + "check official sources",
     never eligibility advice).
   - d 23:00 = china-route (unchanged).
   **SHORTS v3 "SINGLE-CLAIM SPECTACLE" (owner 2026-09-02 turnaround, STYLE v2.6 —
   supersedes the 9-12-cue fact-card format; data: our fact-cards cap at ~1k
   views / 0.5% likes while single-claim spectacle Shorts break out from
   sub-1k-sub channels):**
   - ONE concrete surprising claim per Short; it IS the title and it IS cue 1
     (big line) with the brand line small beneath it in the same cue
     (`{\fs28}I'm your China Travel Expert`) — hook first, brand still first.
   - **(rewritten 2026-10-17, POV plan §0c — the old "spectacle-first
     aerial/drone" rule is gone):** 4-6 cues; F1 13-18 s; F2 and F4 14-20 s during
     the test (through 11-16); F3 15-22 s. Frame 0 = forward first-person motion
     (F1/F2), a human-scale ground shot (F4), or the price card or owner receipt
     (F3). Aerial: at most 1 shot per Short, never at 0 s (frame-0 check in §0c.3).
     Plain Ken-Burns photo motion is allowed; `--photo-motion pov` only under the
     §0c.4 limits, never as POV footage. Each F4 Short carries one distinct
     verified fact so the run does not read as templated. Footage gate unchanged.
   - Audio per §0c.1: F1/F2 keep ambient sound with the music low and no EDM
     drop; F3/F4 use the bed as the main track (beat-locked cuts there only).
   - Title = the claim in ≤60 chars, curiosity gap, no series prefix clutter.
   **Q4 PLAN (owner 2026-09-17, plans/q4-2026-plan.md — three pillars; this
   overrides the weekday theme table above where they conflict):**
   - **Wed + Sun slot a = 《China Price Check》** the channel's signature
     subscribable series: ONE price comparison per episode, both sides verified
     THIS RUN, both in USD, same tier. Title always starts "China Price Check:";
     closing cue always teases next week's comparison ("Next: <thing> vs <thing>");
     file to the "China Price Check" playlist. Queue ids cpc-*.
   - **slot c, 2-3×/week = 《China Trip Planner》** search-intent utility (queue
     ids ctp-*): title = the exact query travellers type. These compound over
     4-8 weeks — do NOT judge them by day-1 views in the postmortem; mark them
     `search-compounding` in RUNLOG and review monthly instead.
   - **Seasonal lead times (miss it and it waits a year):** Golden Week Oct 1-7
     content ships before 09-30; Harbin Ice Festival + CNY 2027-02-06 planning
     content ships in November (8-10 weeks of ranking lead); year-ahead piece in
     December.
   - **Topic gate:** if a topic has no honest footage AND no number, it is not a
     video — pick from cpc-*/ctp-* instead (this week's three LOSERs were all
     site-specific culture cards with generic footage).
   **HOOK v4 — NUMBERS ARE MANDATORY (owner 2026-09-09 「没有hook，没有数字」):**
   Every Short's TITLE and cue 1 must carry a number, price, ratio or hard
   superlative. No number → the topic is not ready; re-angle or pick another.
   Three owner-specified hook families, rotate them:
   1. **PRICE-ANCHOR (highest priority)** — the same experience at a fraction of
      a Western price. Both sides verified THIS RUN, same tier, both in USD:
      "Switzerland's famous train: $290. The same kind of view in China: $25."
      Never compare budget-vs-luxury to fake a ratio; state the real multiple.
   2. **DISCOVERY** — "the stunning place is everywhere, you just have to look":
      "Nobody photographs this street — and it is 600 years old."
   3. **PRIVATE-GUIDE** — "I'll walk you through it": "Ten minutes with a local
      guide in Xi'an, and you skip the two-hour queue."
   Price/number sourcing: two independent sources, dated, in the description.
   **LIKE-CTA (every Short): one cue at ~60% progress (the emotional peak,
   NOT the ending — half the viewers are gone by then): "Double-tap if you'd
   walk this street / 想走这条街的点个赞" — rotate the wording daily.**
   Legacy mix reference (superseded):
   - a 13:00 + b 17:00 UTC = `china-culture` Shorts (ancient-culture products:
     heritage architecture 陈家祠/骑楼/园林/寺庙, crafts 非遗 porcelain/silk/
     embroidery, opera/calligraphy/tea ceremony, festivals & customs, history
     stories). Serve THREE audiences and rotate explicitly: 打卡 check-in
     tourists (visually stunning spots), true culture lovers (depth/craft
     stories), families with kids (fun "why does China do this?" explainers).
   - c 20:00 UTC = `city-travel` with HERITAGE priority (古迹/古镇/historic
     districts/old streets; modern city only as contrast shots).
   - d 23:00 UTC = `china-route` (owner 2026-08-11: routes, NOT standalone food —
     each series = one travel route told stop-by-stop; architecture/heritage stops
     lead, food appears only as a "reward stop" ON the route (「走完这段城墙，
     城根下正好这碗面」). This lane feeds the 私域 route-guide funnel directly.
     Old china-food seeds may be recycled as route stops, never as the subject.
     Route portfolio, market positioning, premium-audience language rules and
     honesty boundaries: `automation/youtube/plans/route-products.md` — route
     episodes use its §3 selling mechanics: expertise-proof framing, premium
     filtering words (private/bespoke/worth-it, never budget/hack), CTA to
     channel page only.)
   **HOOK DOCTRINE (owner 2026-08-11 + 07-15 data: fact-first beats place-first
   ~4x):** frame 0 = a visual that exists NOWHERE outside China (hanging temple,
   tulou ring, nail-free pagoda, red walls) + first cue = a surprise FACT about
   it. (2026-10-17: the frame-0 SHOT TYPE now follows §0c.3 — first-person
   motion or an eye-level ground shot, never aerial.) Food is never the opening
   hook in culture/route videos — it is the mid-route reward beat.
   **HOOK FORMULA v2 (2026-08-13 weekly data):** best performers are
   PARADOX/SUPERLATIVE NUMBER hooks about the site itself — "45,000㎡ of murals,
   not one signed" (988v) / "older than its city" (865v) / "grows 5cm a day"
   (631v). Process-count framings ("72 hands to make one bowl" 301v, "one hall
   seven crafts" 113v) underperform as TITLES — keep craft-count facts in the
   body, title on the paradox. **SINGLE-SUBJECT rule (Thu 08-13 retention data:
   single-subject holds ~16-18s vs montage ~9-11s): one Short = ONE site/object;
   every b-roll query is about IT — no montage drift.**
   **GUESS-CHAIN format (comments lever, 2-3×/week on slot c):** title/hook =
   "Guess ..." (dynasty/price/city), answer WITHHELD in that video —
   "answer in tomorrow's episode" as the closing cue; next day's slot c OPENS
   with the reveal. Chains dailies + gives viewers a real reason to comment.
   **Sub-CTA variant (rotate into the soft-CTA final cue):** "Follow your China
   Travel Expert — one China secret daily / 关注你的中国旅游专家".
   Longform still paused. 连载 series format stays (1×4-part or 2×2-part daily).
   **连载 format (小红书 style):** each day = ONE 4-part series or TWO 2-part
   series. Parts of a series share a subject (one dish / one food street / one
   food question) but each part must stand alone AND end with a next-part tease
   as the closing cue (「下集：汤底的秘密」…). Titles carry the series name +
   (上)(下) or Part 1/2/3/4; every series gets its own playlist in addition to
   中国美食. Modern + 贴近生活 topics first: 新中式茶饮, 现制酸奶, 街头早餐,
   夜市, 外卖时代, 网红店排队学, 家常菜革命 — not museum food history.
   Slot order within a day = story order (morning slot = Part 1).
   **Owner-footage slot claims (check FIRST):** read
   `state/owner-slots.json` — if today's date has claimed slots with a non-null
   `videoId` (owner real footage already uploaded/scheduled by an interactive
   session or an earlier fire, lane `owner-footage`), those slots are TAKEN:
   produce NO stock video for them, count them toward the day's total, and note
   the claim in RUNLOG. A claim without a videoId is not taken: produce that slot
   (an F1 recut per §0c.6). 实拍永远优先于库存快剪 (see
   `automation/youtube/REAL-FOOTAGE.md`). Missing file or no entry for today = no claims.
   **FOOTAGE-FIRST GATE (owner 2026-08-14, HARD — after 洪崖洞 takedown: subs
   claimed "this building" over generic city b-roll):** BEFORE committing to any
   site-specific topic, actually search Pexels (+Pixabay if keyed) for the site
   (Chinese + English names). PASS = ≥3 usable clips whose Pexels title/slug
   identifies THE SITE ITSELF → proceed; the script may then say "this
   temple/building". FAIL = pick one: (a) RE-ANGLE to what the footage really
   shows (city-level story, honestly framed), (b) MAP-FORMAT episode (3D-map/
   route-facts framing where generic b-roll is honest — the benchmark account's
   validated style), or (c) DEFER the topic (real footage later beats fake now).
   **Subtitle honesty rule: "this X" / 指认式 phrasing is ONLY allowed over
   confirmed site-specific footage. Generic footage → generic claims.** Night
   queries stay banned. Every run COMMITS final.mp4.credits.json (recent runs
   skipped it — it is the audit trail for this gate).
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

## 3-5. Produce each video (loop slots a → c → d; format per §0c)
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
   - Short (lengths and cue counts here are superseded by SHORTS v3 and the
     §0c test bands; the cue-1 brand rule and the 起承转合 shape still apply)
     (20-28s — 7-day data 2026-07-11: 22s cut doubled retention vs 55s):
     9-12 cues, each 2-2.5s, 中文行 ≤12 字 (STYLE.md v2 fast rhythm — information
     density beats lingering) — **CUE 1 IS FIXED (owner 2026-08-11: 第一句永远
     自报家门): `I'm your China Travel Expert.` / `我是你的中国旅游专家`, at
     0.0-1.6s MAX, laid OVER the frame-0 wow visual (the visual hooks while the
     brand line brands — never a talking-head intro card)**; cue 2 (≤1.6s in)
     delivers the curiosity-gap fact the last cue answers; the first shot is
     still the single most striking clip (never an establishing wide) → 承 2-3
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
   - **Each cue = ENGLISH ONLY, single line ≤10 words (owner 2026-08-30: no
     Chinese in Shorts subtitles; FontSize 19). Dialect-bank flavor moves to
     TikTok captions/descriptions only.** Leave 1-2
     cue-free seconds between movements — the footage breathes.
   - **VOICE (2026-10-17, replaces JOURNEY VOICE — it told the loop to invent
     first-person experiences over other people's footage):** over licensed or
     stock footage, use second person only (you / "POV: you…"). First person (I /
     my / Follow me / My first stop / I'd come back) only over owner footage (F1).
     "POV:" and "Would you…?" titles only over F1/F2 first-person footage. Say a
     place name only over clips whose source slug or Commons title names it
     (pov-library `placeSpeakable`); px-39312225 is "Great Wall" with no section
     name. Write each caption from that clip's `verifyNote` and `mood`; never add
     speeds, routes, step counts or scenery that the frames, or a source covering
     that exact clip or place, do not support. Owner-clip times come from file
     metadata only. Journey structure (arrive → approach → inside → detail →
     reward) is still fine; the fixed brand cue "I'm your China Travel Expert" stays.
   - Set total duration from the cue plan (Shorts ≤32s, video ≤120s).
   claim with WebSearch/WebFetch this run; collect source URLs. Produce `script.md`
   (with sources), `voiceover.txt` (clean spoken text), `meta.json` (title ≤95
   chars, ENGLISH-FIRST fact hook, optional 2-6字 Chinese accent tail `| 热干面`,
   series label in English ("How China Eats a Fish P2"); **brand tagline (owner
   2026-08-10, algorithmic identity — MANDATORY on every new video): title =
   `<hook + series label, ≤72 chars> | China Travel Expert`. Write the hook to
   fit; the brand suffix is never dropped — the platforms' recommenders must
   associate every upload with the china-travel niche**; description follows the
   PERSONA.md §3 template EXACTLY (EN hook → EN facts → 🧭 Expert Tip → one 中文
   hook line → fixed signature block verbatim → credits/disclosure → exactly 3
   hashtags per step 5); tags = core set + 3-5 place terms (step 5); categoryId 19 (Travel & Events; 27 only for
   education pillars); `defaultLanguage: "en"`; `publishAt` set to the slot's UTC
   time today; privacyStatus private — scheduling requires it). Title: write 3
   candidates, pick best (optionally `vidiq_score_title`, 5 credits, within budget).
2. **Voiceover: NONE (Shorts; longform voice = §4L).** ElevenLabs is paused for Shorts (scripts kept —
   do not call them). Local flavor now lives in the SUBTITLE text: use the city's
   words from the dialect bank (京味儿化 / 沪语词 / 川话 巴适...) in the 中文 line
   with the English line translating the spirit. Zero profanity in all active
   pillars.
3. **Video** — `node scripts/assemble-video.mjs --out .../final.mp4
   --duration <total seconds from the cue plan>
   --music <per STYLE.md music-energy table> --srt .../subs.srt
   --queries "<3-5 concrete b-roll queries>" --format <9x16|16x9>
   --title "<short overlay title>" --badge "CHINA TRAVEL EXPERT"
   --style <STYLE.md v2: clean default | warmfood for food close-up pieces | heritage for culture/Sunday>
   --pace <fast for ALL Shorts (default) | slow ONLY for Sunday longform/heritage>
   --seg-seconds <2.5-3 fast, 7-8 slow>`.
   That is query mode (F3/F4). F2 renders use `--clips` (§0c.5): `assemble-video.mjs
   --clips <run>/clips.json --duration <cue-plan total seconds> --fit auto|crop|frame
   --keep-audio 0.6 --sfx none …`, with clip windows that add up to at least that
   length (§0c.5 length rule; a "cycling the list" WARN = re-pick); F1
   uses `scripts/owner-recut.py` (§0c.6). Queries get the POV/ground words from
   config `styleGuide` — never aerial/drone words. After every render: the §0c.3
   frame-0 check and aerial cap.
   STYLE.md is the visual authority — riben is retired (yellow cast), fade-in is
   gone in fast mode (frame one IS the hook), hard cuts only on Shorts.
   **Subtitles are colored + animated + SFX by DEFAULT (STYLE.md v2.4, owner
   2026-08-24): white EN / gold 中文 / coral number pops / amber ★Expert-Tip line,
   per-cue scale-bounce entrance, and a soft "pop" SFX on each cue. No flag needed —
   assemble-video.mjs applies it whenever `--srt` is passed. Use `--sub-style plain`
   / `--sfx none` only to opt out.**
   B-roll queries per styleGuide 生活感 quota (hard): >=50% of shots show people
   mid-action — query in people-action language ('<place> street food vendor
   cooking', 'family dinner table', 'night market crowd eating', 'people cycling
   alley'); atmosphere shots (mist/steam/lantern dusk) only for the establish and
   close. NO night scenes, no stock-cliché business shots. Footage sources:
   Pexels + Pixabay (auto when PIXABAY_API_KEY exists) ONLY — never scraped/
   crawled online clips. 中式 checklist per video: at least one of — poem/成语
   line in the subs, local phrase from the dialect bank, craft/food close-up
   with cultural note.
   **Music rules — `automation/youtube/MUSIC.md` is the authority (owner
   2026-08-11 delegated music strategy fully); since 2026-10-17 the bed is picked
   by FORMAT from the §0c.1 audio table** (MUSIC.md §5 once written). The old
   "oriental-edm → route/travel + drone landform reveals" pairing is deleted.
   Non-POV fallbacks: cinema-orient → culture reveals + mountain/desert
   landscapes; guzheng-calm → terraces, water towns, lakes; cpop-groove →
   small-town street life/food beats; lofi-* general fallback. F1/F2 never use
   an EDM drop. Before keeping any source or owner audio, apply the §0c.5
   ambient rule (shop, busker or commercial music → mute or drop that audio).
   HARD rotation rules (owner 2026-08-30: 背景音乐要经常换): rotate across the
   format's list in §0c.1, using only files present in `assets/music/` this run
   (legacy beds + decrypted el-* + any wc-*/yal-* in the manifest); no track
   repeats within the same day; no track in the same slot on adjacent days; no
   track >2 uses per rolling 3 days (grep published.json `music`). No vidIQ music
   generation any more (config `vidiqRules.musicGenMonthlyCap: 0`).
   **OWNER / LICENSED TRACKS:** `assets/music/manifest.json` describes every bed
   (`aiGenerated`, `vault`, `license`, `attribution`, `style`, `bpm`). yal-*
   (YouTube Audio Library, owner downloads — none in the folder today) are
   YouTube-only; credit their real title + artist:
   `🎵 Music: "<title>" — <artist> (YouTube Audio Library)`. New human-made drops
   arrive via `node scripts/ingest-music.mjs --in <path> [--mood …]`.
   **MUSIC CREDIT (owner 2026-09-09 「不tag音乐名字」 + AI disclosure 2026-10-17;
   exact formats in MUSIC.md §6, `<title>` from the manifest):** every description
   ends with one credit line per bed before the hashtags — legacy beds
   `🎵 Music: <title> (AI-generated, vidIQ)`; el-* `🎵 Music: <title> (AI-generated,
   ElevenLabs)`; wc-* (Wikimedia Commons) `🎵 Music: "<title>" by <artist>` + the
   manifest's `attribution` line verbatim; yal-*: as above. Never claim a
   commercial song. A CC BY track that draws a third-party Content ID claim is
   disputed with its licence page (log it).
   **ADD SOUND** (Studio/app-only "Add Sound" library, no API): no longer a
   per-Short block — the Saturday OWNER STUDIO list (§8) carries at most 1, for the
   week's best Short. Adding a licensed track in Studio does not reset views.
   Match `--seg-seconds` to the track's bar length per MUSIC.md §3 (105BPM→2.3s,
   90BPM→2.7s, 100BPM→2.4s) so cuts land on beats (F3/F4 only; F1/F2 cut on the
   motion). Never attach copyrighted commercial music in the pipeline (Content ID).
   If `output.extraFormats` in config.yaml is non-empty, re-run once per extra
   format (same vo.mp3, out `final-<fmt>.mp4`) — cross-posting masters, NOT
   uploaded to YouTube.
4. **Thumbnail** (longform only) — `node scripts/generate-asset.mjs --prompt
   "<clean, text-light 16:9 concept>" --out .../thumb.jpeg --size 1536x1024`, else
   frame-grab: `ffmpeg -ss <t> -i final.mp4 -frames:v 1 thumb.jpeg`. YouTube cap
   2 MB — recompress with `ffmpeg -i thumb.jpeg -q:v 4 thumb-small.jpeg` if larger.
5. **Append Pexels credits** from `final.mp4.credits.json` to the description in
   `meta.json` ("Footage: Pexels — <urls>"; Commons clips: their attribution
   string + file page URL; owner footage: "Filmed by the channel owner") — credits
   sit between the persona signature block and the hashtag line (PERSONA.md §3
   order), followed by the music credit line (§3 step 3). Prices: 2 dated sources
   listed in the description.
   **Description = PERSONA.md §3 template.** The EN hook line doubles as comment
   bait where natural; the in-video either-or question stays the primary comment
   driver (nobody reads Shorts descriptions).
   **Hashtags (2026-10-17 — only 3 show above the title; this overrides the 4-5
   count in PERSONA.md §3 item 7): exactly 3, ENGLISH:** `#ChinaTravel
   #ChinaTravelExpert` + 1 exact place tag (#Mutianyu, not #GreatWall, when the
   video IS Mutianyu; #GreatWall over px-39312225). Titles stay hashtag-free.
   **Metadata tags (snippet.tags):** CHANNEL CORE SET per PERSONA.md §5 + 3-5
   exact place terms (site / town / region names as searchers type them). The
   per-video 8-10 keyword research step is deleted (tags play a minimal role).
   RUNLOG line lists each slot's hashtags so tag discipline is auditable.
6. **Playlist filing:** after each upload, run
   `node scripts/youtube-playlist.mjs --title "<playlist>" --video <videoId>`
   (script wired 2026-07-15 — reuses by exact title, creates public if missing).
   Playlists (EXACT titles — renamed English-first 2026-08-09; the script matches
   by exact title, a stale name would create a duplicate): "China Food 中国美食" /
   "China Travel 城市旅行" / "City Walks 城市漫游" / "China Coffee 中国咖啡" /
   **ARCHITECTURE PIVOT 2026-10-19: `china-architecture` → "Ancient China
   Architecture 中国古建筑" (create on first use, then backfill the earlier heritage
   Shorts from published.json — Mutianyu, Temple of Heaven, White Stupa, Summer
   Palace, Great Wall, Badaling/Mutianyu DEBATE, Jiankou, zero-nail halls, Guangzhou
   temples — so the shelf opens with 10+ videos); each `arch-*` series gets its own
   playlist too (e.g. "Pagoda Types 中国塔"); F3 stays in "China Price Check".**
   **NATURE PIVOT 2026-09-26 (paused 10-19): `china-nature` → "China Nature 山河地貌",
   `small-town` → "China Small Towns 小城古镇" (both created on first use, then
   backfill the earlier landscape Shorts listed in plans/nature-pivot.md §1 —
   Danxia, Jiuzhaigou, Zhangjiajie, QG loop, Silk Road, Duku, Tarim — so the
   shelf opens with 10+ videos); routes keep "China Travel 城市旅行" + series;**
   new series playlists are created ENGLISH-FIRST: "<English series name> <中文名>"
   with the PERSONA.md playlist description sign-off.
   Backfill note: on first use, also file this week's earlier theme videos (see
   published.json) so the shelf isn't a single video.
6. **Upload** — if the upload lane is available:
   `node scripts/youtube-upload.mjs --video .../final.mp4 --meta .../meta.json
   [--thumbnail .../thumb.jpeg]`
   - `meta.json` must carry `music` and `aiFootage` (§0c.7); the uploader decides
     `containsSyntheticMedia` from them and prints the decision — log it.
     (`--dry-run` prints the request body without uploading.)
   - `publishAt` in the past by the time you upload (overrun)? Remove it and set
     privacyStatus public (immediate publish) — note the change in the run log.
   - If the API leaves the video locked private (unverified project), record that
     honestly — do not claim it is public/scheduled.
   - Upload lane missing → **dry-run**: keep the package, set
     `"status": "awaiting-upload-credentials"` in `meta.json`, continue.
6c. **Multi-platform clean masters — WEEKLY since 2026-10-17 (was daily):**
   every run still writes `social-caption.txt` per Short per PERSONA.md §4 (first
   line starts `China Travel Expert 🧭 | <hook>`; hashtags always include
   #chinatravelexpert (+ #chinatravel #traveltok etc., NO #Shorts, ≤300 chars)) —
   text only, committed with the run. The daily chat delivery of 3 clean masters
   is gone. **Fridays = SOCIAL PACK:** pick the week's 3 best Shorts by views
   (Mon-Thu of this week + Fri-Sun of last week), re-render each from its
   `runs/<date>-<slot>/` artifacts (clips.json or the script.md clip list +
   subs.srt) WITHOUT music (yal-* beds are YouTube-only; the owner adds a
   platform sound in-app) and WITH `--badge "CHINA TRAVEL EXPERT"`; F2 keeps its
   `--keep-audio` ambient; F1 recuts: `ffmpeg -i final.mp4 -c:v copy -an` of a
   fresh owner-recut.py render. SendUserFile the 3 masters + captions (recompress
   crf 24 if a file exceeds 29MB). Missing artifacts → say so, never fake.
   **TikTok draft push (owner 2026-08-12):** only if TIKTOK_CLIENT_KEY +
   TIKTOK_CLIENT_SECRET + TIKTOK_REFRESH_TOKEN exist: push the Friday pack with
   `NODE_USE_ENV_PROXY=1 node scripts/tiktok-draft-upload.mjs --video <clean.mp4>`
   (on API error log verbatim in RUNLOG — never fake a push).
   **Back-catalog exports:** `state/social-export-queue.json` (views desc): on
   Fridays add the top 2 `"status": "pending"` items to the pack, re-rendered the
   same way; mark `"sent"` + date, or `"no-artifacts"` and move on.
7. **Commit checkpoint** — commit this slot's text artifacts + state delta before
   starting the next slot (protects against mid-run session death). Media never
   enters git (runs/.gitignore).

## 4L. LONGFORM DAY — EVERY Friday from 2026-11-06: search guide (G) and mechanism explainer (M-Long) ALTERNATE (ROAD-TO-1M 2026-10-23)
**M-Long Fridays: 11-13, 11-27, 12-11, 12-25, 01-08 …** — a 10-14 min narrated
"How Ancient China Built It" explainer built from the text assets the Sunday manager
session committed to `plans/mechanism/<topic>/` (script with ≥20-claim fact ledger,
scene JSONs / renderer, thumbnail spec, 3 child-Short briefs). The Friday run renders
the diagrams (`scripts/mechanism/*.py`), narrates (ElevenLabs Rachel while credits last →
`scripts/tts-openai.mjs` marin, hard cap $2/month logged in RUNLOG → captions-only as the
last resort), assembles per `plans/mechanism/yingxian/longform-assemble.sh` pattern
(real photos only where the slug/Commons title names the site; CC BY attribution lines
in the description), makes the thumbnail (real photo + ≤4 words, code-drawn text; one
gpt-image illustration allowed only as a non-photo "illustration" and never a fake
photo of the site), uploads 15:00Z with `fmt:L lane:M-Long`, and schedules 3 child
M-Shorts over the next 7 days. If the text assets are missing or a fact lacks 2
sources, slip the M-Long to the next M-Long Friday, log it, and run that day as a normal
Shorts day (never a padded video). First M-Long = Yingxian (`plans/mechanism/yingxian/`).
**G Fridays: 11-06, 11-20, 12-04, 12-18 …** — the search guide below.
(config `longform`: cadenceDays 7 from 2026-11-06 with lanes alternating; before that
anchorDate 2026-10-23 → 10-23 G. Search brings 46 % of our longform views and Home 0, so the
weekly alternation of 8-10 min guides and the 35-50 min AMBIENT stock-doc lane is
DELETED — the ambient lane was never produced and cannot be sourced honestly.
`state/pending-video-updates.json` still applies once when it has pending items.)
If (today − anchorDate) % cadenceDays == 0: ALSO produce ONE 6-9 min ENGLISH-ONLY
search guide (16:9) per `plans/longform-v2.md` where it does not conflict (§2
narration rules incl. no fabricated anecdotes + TTS phonetic QA, §3 layered visuals,
§4 title/thumbnail, §7 pipeline, §8 audio: `--sfx none`, no short-loop beds, 2-3
underscores switching at chapter boundaries, −18 dB under VO).
- **Title = the exact narrow query** a traveller types, checked against YouTube
  search suggestions (WebFetch `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=<query>`
  or WebSearch; no vidIQ spend). The answer comes in the first 30 s; chapters in
  the description; every price and time verified within 60 days, sources listed.
  ZERO Chinese anywhere. Playlist "China Travel Guides"; published.json slot "L",
  `format: "L"`, `aspect: "16x9"`. Shoot for a guide worth watching — never publish a
  weak guide to fill a Friday.
- **Footage audit gate — the Wednesday 2 days before** (10-21, 11-04, 11-18, 12-02):
  the topic needs ≥3 min of slug-named, non-aerial LANDSCAPE footage that passes a
  3-frame check (owner footage counts). `scripts/pexels-probe.mjs` is portrait-only
  (8 results a query), so it is wrong for a 16:9 guide: query landscape directly —
  `curl -s -H "Authorization: $PEXELS_API_KEY" "https://api.pexels.com/videos/search?query=<q>&orientation=landscape&per_page=40"
  | python3 -c 'import json,sys; [print(v["id"], v["duration"], v["url"]) for v in json.load(sys.stdin)["videos"]]'`
  (never echo the key) — plus the POV library's landscape entries (`pov-library.mjs
  list --usable --china --orientation landscape`). Sum the durations of landscape
  clips whose slug names the place (portrait clips do not count toward the 3 min),
  LOOK at 3 frames of each kept clip; log `L-audit: <topic> <minutes> PASS|FAIL`.
  FAIL → the fallback topic. (Slice 3: `--orientation` / `--per-page` for pexels-probe.)
- **Schedule (ARCHITECTURE PIVOT 2026-10-19 — replaces the Zhujiajiao/Dali list):**
  10-23 "Forbidden City Tickets 2026" (query: forbidden city tickets; ~21 min of
  slug-named FC clips, audit 10-21); 11-06 "Temple of Heaven Beijing"; 11-20 "Xi'an
  City Wall"; 12-04 "Xi'an Bell Tower and Drum Tower"; 12-18 "Forbidden City and
  Temple of Heaven in One Day"; 01-01 "Three Pagodas Dali". Footage audit lists,
  outlines and fallbacks: `plans/architecture-pivot.md` §3. The title is the exact
  query + " | China Travel Expert", ≤95 characters in total (YouTube's limit is 100;
  the uploader cuts longer titles and mangles the suffix). Child Shorts come from the
  matching `arch-*` series (Forbidden City Decoded after 10-23, Ming Walls & Gates
  after 11-20).
- **Child Shorts:** 3 same-place Shorts in the next 7 days (they fill F4/F2 slots),
  each ending with a 2-second on-screen CTA "Full route: tap the related video
  above". A child must show the guide's place by slug or owner metadata;
  px-39312225 is never the child of a guide that names a Great Wall section. The
  owner links them in Studio (Saturday list, §8) — the Data API has no field for it.
- **Voice ladder (decision D3):** (1) ElevenLabs while the already-paid credits
  last, ALWAYS `node scripts/elevenlabs-tts.mjs --voice 21m00Tcm4TlvDq8ikWAM …`
  (Rachel; never `--voice env` — that voice returned broken audio on 10-17). QA the
  result: `ffmpeg -i vo.mp3 -af astats -f null - 2>&1 | grep "DC offset"` — any
  |value| > 0.05, or audio that does not match the script, counts as a failure.
  (2) ElevenLabs fails (key, credits, cancelled, QA) → config `longform.voice`
  decides: `"none"` (DEFAULT, $0) = no narration: on-screen English text carries
  the guide (burned captions written as the narration) + ambient sound
  (`--keep-audio`) + music; `"openai"` (only after the owner says yes; ~$0.2 an
  episode) = `node scripts/tts-openai.mjs` with the same flags. Any AI voice →
  "AI narration" disclosed in the description. Never skip a guide only for lack
  of a voice; log `L-voice: elevenlabs-rachel | none | openai`.
- A POV-walk longform is allowed only from ≥10 min of continuous owner footage; it
  replaces that Friday's guide (landscape 4K, ambient sound, no narration, chapters,
  3-5 vertical child cuts).
- **Kill check 11-20:** if guides #1 and #2 each have <100 views at 14 days and
  Search views are not rising, pause the lane until owner continuous footage exists
  (log it; Fridays run Shorts only). Any guide with ≥30 % average view and ≥50 %
  Search → the next 2 guides take the same kind of query.
If a needed step fails (no footage, audit FAIL with no fallback): save the script
+ shotlist as the run artifact, log `longform blocked: <reason>` honestly, and
continue the normal Shorts day.

## 5a. Owner POV recut queue (rewritten 2026-10-17; was "Owner-footage pending uploads")
Every Thursday the §0c X slot (F1) takes one recut from
`automation/youtube/plans/owner-recuts.json`, rendered by `scripts/owner-recut.py`.
Schedule, pair/reuse/face rules and the stop rule: §0c.6 (10-22 = R-01 on a calm
bed). Steps: `python3 -I scripts/owner-recut.py --id <R-NN> --out
<run>/final.mp4 [--music <bed>]` → §0c.3 frame-0 check → meta.json from the recut's
`final.mp4.recut.json` hints + PERSONA.md §3 (title = the recut's hook; `owner:
true`, `footage: owner`, `music` = the bed) → upload → only then claim the slot in
`state/owner-slots.json` with `{videoId, title}` (§0c.6) → playlists "China POV Walks & Rides" + the old series playlist ("Beijing,
Walked 带你走北京" for Beijing recuts) → append one `{date, videoId, in, out, what}`
entry per segment to that source's `uses` list in owner-recuts.json (the 8-week
reuse check reads it; `python3 -I scripts/owner-recut.py --list` shows the
reuse-safe dates) → RUNLOG `fmt:F1 recut:<R-NN>`.
Legacy (the token outage queue): if `state/pending-owner-uploads.json` ever has
pending entries again, upload up to 3 per run at the next free slot d, claim each
date in owner-slots.json, move entries to "done"; token dead → one log line, no retry-spam.

## 5b. Persona metadata rollout (until queue empty)
If `state/metadata-retrofit-queue.json` has `"status": "pending"` items, run
`NODE_USE_ENV_PROXY=1 node scripts/apply-video-metadata.mjs --limit 40` AFTER all
of today's uploads complete (uploads eat ~6400 quota units; 40 updates = 2000 —
stay under the 10k daily quota). The script is resumable and stops itself on
quota exhaustion. Log done/pending counts in RUNLOG. Commit the queue file.

## 6. Analytics pulse (Mon & Thu only — credit budget)
The YouTube Analytics API (via yt-postmortem, free) comes first once the owner
enables it; vidIQ is the fallback and only while its balance is ≥ the floor of 40
(125 credits until the 10-29 reset — spend nothing else from it).
If vidIQ MCP is present AND today is Monday or Thursday (UTC):
`vidiq_channel_analytics` (channel UCSU99qan7oWIEY-c8uYmuSQ, last 7 days, 5 credits)
→ append one summary line to `state/analytics.md`; if a pillar or style clearly
outperforms, reorder the queue and say so in research.md. Other days / absent: skip
silently. (~15 credits/week total with the Sat trend call — sustainable within the
150/month cap.)

## 7. Write state back (never skip)
1. Dequeue the used topics; save replenished queue to `state/queue.json`.
2. Append each video (or dry-run entry) to `state/published.json`:
   `{date, slot, title, videoId|null, url|null, pillar, lane, status, publishAt,
   format, footage, povType, owner, aspect, music}` (§0c.7 for the new fields).
3. Prepend one line per slot to `state/RUNLOG.md`:
   `date slot | fmt:<X> | topic | lanes | outcome | credits` (+ footage / frame0 /
   synthetic per §0c.7). Commit `state/view-snapshots.json` too.
4. Final commit of everything under `automation/youtube/` (+ nothing else; never the
   decrypted `assets/music/el-*.mp3`; always each run's `clips.json` — the §0c.3 F2
   used-clip check reads only committed clips.json files), message
   `yt-cycle(<date>): <n> Shorts[ + L] — <posted|scheduled|dry-run|blocked>` and push to
   `claude/youtube-automation-workflow-v8egf3`
   (`git push -u origin claude/youtube-automation-workflow-v8egf3`, retry 4x with
   backoff on network errors).

## 8. Report (+ style spot-check) — rewritten 2026-10-17
**Daily:** stack the day's `frame0.jpg` sheets (§0c.3 — each already shows frame 0
first) into one contact sheet (`ffmpeg -i a/frame0.jpg -i c/frame0.jpg -i
d/frame0.jpg -filter_complex vstack=inputs=3 day-sheet.jpg`; fewer inputs on a
ship-2 day) and send it via SendUserFile (caption: date + titles) — the owner
spot-checks look/pacing daily. Then exactly one line per Short:
`<slot> / <fmt> / <footage> / <hook type> / <scheduled URL or degrade reason>`,
plus one line with vidIQ credits spent and queue depth. If a check fired
(`check Studio`, `CHANNEL-LEVEL: check Studio`), it is the report's FIRST line.
No per-Short ADD SOUND or Studio-editor lines any more.
**Friday:** the SOCIAL PACK (§3 step 6c): the week's 3 best clean masters + captions.
**Saturday — `OWNER STUDIO (10 min)`**, exact video ids and Studio URLs
(`https://studio.youtube.com/video/<id>/edit`):
1. Related video: each child Short of the latest guide → that guide (list child id →
   guide id), plus any Short over 500 views at 48 h → the matching guide.
2. Test & Compare: 3 printed titles for the latest longform (`<id>`).
3. A request for this week's "Viewed vs swiped away" screenshot (Studio → Analytics →
   Advanced mode, Shorts).
4. At most 1 ADD SOUND: the week's best Short (`<id>` → Studio Editor → Audio, a
   YouTube Audio Library track; trending app sounds can only be added when a Short
   is created in the app — MUSIC.md §8 and `state/add-sound-list.md`).
5. 10-24 only (repeat until answered): "f8f7Ftl-8HI (Beijing, Walked EP4) and
   h-6tu1E19j4 (EP5): add to the 'China POV Walks & Rides' playlist? Owner decides
   (child face close-up: EP4 6.7-8.2 s, EP5 1.75-2.75 s)." The routine never adds
   them itself; an interactive session does it after the owner says yes.
**Sunday:** append a format table to RUNLOG and print it in the report — per format
(F1, F2, F3, F4, L): n, median same-day ratio vs F4, 72 h median, average % viewed
(Analytics API; "n/a" while it is off), likes per 1k views; then ONE pooled channel
line: subscribers per 1k engaged views and like rate (likes ÷ views of the Shorts
published that week). Ratios are directional while `pov8w.cityScope` is not approved.
