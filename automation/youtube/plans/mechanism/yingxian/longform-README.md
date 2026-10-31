# proto-longform — narrated explainer prototype (2026-10-23)

Subject: "The wooden tower earthquakes can't kill" — Sakyamuni Pagoda of Fogong Temple, Yingxian, Shanxi (应县木塔).
Everything here was made by this agent in one run; nothing was uploaded, committed, or spent beyond the budgets below.

## Files
| path | what |
|---|---|
| `script.md` | §0 honesty notes · §1 full 12:20 script with visual cues · §2 fact ledger (21 claims, sources, confidence) · §3 shot list with licence/"may name the site" status · §4 lane rationale · §5 five title variants · §6 owner decisions |
| `render_diagrams.py` | code-drawn 16:9 diagrams (SVG→PNG→MP4, 30 fps): `diagrams/map.mp4` (7 s, Natural Earth outline from the world-atlas npm package), `section.mp4` (9 s, 5+4 levels, two column rings), `dougong.mp4` (11 s, bracket set built piece by piece), `sway.mp4` (9 s, flexible vs rigid). Stills `diagrams/*_still.png`, overview `diagrams/sheet.jpg`. No AI, no stock → no synthetic label. |
| `thumbs/T0-control-real-photo.jpg` | control: the slug-named Pexels photo (pxp-15955261) + ffmpeg text |
| `thumbs/T1-why-wont-it-fall.jpg` | OpenAI gpt-image-1 painted illustration + text |
| `thumbs/T2-5-floors-9-inside.jpg` | OpenAI cutaway vector illustration + text |
| `thumbs/T3-no-nails-970-years.jpg` | OpenAI dougong close-up illustration + text |
| `thumbs/contact-sheet.jpg` | all four at 336×189 and 168×94 (sidebar size) — this is what I scored from |
| `thumbs/raw/*.png, *.req.json, *.resp.json` | raw generations, prompts, usage |
| `sample/vo-60s.txt` · `sample/vo-60s.mp3` | cold-open narration, 894 chars, ElevenLabs Rachel via `scripts/elevenlabs-tts.mjs` (65.2 s) |
| `sample/assemble.sh` · `sample/sample-60s.mp4` | 1920×1080 h264/aac, 65 s: VO + el-docu-underscore-04 bed, Ken-Burns stills + diagram clips + text cards |
| `sample/frames-sheet.jpg` | 18 frames pulled from the sample (what I looked at) |
| `dl/` | untrusted downloads: Pexels photo + API JSON, Commons metadata/photos, world-atlas tarball |

## Spend (this agent)
- OpenAI gpt-image-1: 3 × 1536×1024 medium = 4,704 output image tokens (+306 text) ≈ **$0.19** (cap $0.30). 
- ElevenLabs: 894 characters ≈ 894 credits (cap 3,000). 
- Pexels API: 2 requests. Wikimedia Commons API: 4 requests (then rate-limited: 429 on most file downloads; fetched slowly in the background). vidIQ: 0 credits. YouTube Data API: 0 units. No GPU; diagrams render at ~30 ms/frame on CPU.

## Thumbnail scoring (looked at contact-sheet.jpg at 168×94 and 336×189)

Benchmark: the eval's 1M-sub faceless explainers (B1M, Primal Space, RealLifeLore, Wendover, Ancient Architects, Kento Bento — `m1/million-cases/cases.json`). Their thumbnails could not be downloaded (i.ytimg.com is proxy-blocked, noted in the pivot plan), so I scored against the conventions those channels share and that the eval recorded: one big recognisable subject filling ≥40 % of the frame, ≤5 words in one or two lines, a single accent colour, high contrast with the dark YouTube UI, a "what/why" tension rather than a label, and no reliance on a face. Scale 1-10, honest, not vidIQ.

| | subject clarity | text legibility @168px | curiosity gap | honesty / disclosure | overall | notes |
|---|---|---|---|---|---|---|
| T0 real photo | 8 | 8 | 6 | 10 (real, slug-named) | **7.5** | Looks like Ancient Architects: authentic, bright sky contrast, text reads at sidebar size. Weak point: the top of the pagoda only; "970 YEARS OF QUAKES" asserts a count we don't have — change to "970 YEARS. STILL UP." |
| T1 painted pagoda + cracks | 7 | 9 | 8 | 7 (illustration, must be captioned as one) | **7.5** | Closest to Primal Space / B1M drama. Best question-type text. Pagoda is generic (6 eaves, not the real silhouette) and the image is dark; at 168 px the tower reads as a silhouette. Needs a brightness lift on the tower and a warm rim light. |
| T2 cutaway vector | 5 | 9 | 7 | 8 | **6** | On-brand with our diagrams and the most *informative*, but the tower is thin and small; at sidebar size it is a brown stripe. Would work as an in-video card, not a thumbnail, unless the cutaway is enlarged to fill the left half. |
| T3 dougong glow | 4 | 9 | 7 | 6 (AI joint, structurally plausible but not the real joint) | **5.5** | Beautiful at full size, unreadable at 168 px: dark on dark, the subject is an abstract wooden stack. A real photo of the corner dougong (Commons CC BY 3.0 "Fogong temple corner dougong.JPG") would beat it on honesty and clarity. |

Verdict: ship **T1 (A) vs T0 (B)** as the A/B pair; neither is at the level of the benchmark channels yet (I would put B1M/Primal Space at 9-10 on the same scale). The gap is the subject: top channels show the *whole* iconic object large and lit. Our best fix is cheap — a wide, bright real photo of the full pagoda (the Commons CC BY-SA 2019 "at Dust" shot is exactly that, if the owner accepts share-alike), or re-prompting T1 with the real silhouette (5 storeys, 6 eaves, octagonal, white-plastered ground storey, spire) and brighter key light.

## Sample clip — what the frames show (sample/frames-sheet.jpg)
- Works: VO pacing (138 wpm, breath pauses land on cuts), the "almost no nails" / "1926 · 200+ shells" / Guinness cards, diagram legibility at 640 px, the b/w treatment for the 1926 beat, music under the voice.
- Weak: only ONE slug-named Pexels photo of the site exists (portrait), so the same tower-top crop recurs 4× in 65 s; the Commons CC BY photos were rate-limited (429) for most of the run — when they land, `assemble.sh` picks them up automatically (dougong close-up for the 1926 beat, panoramio full-height shot for the Guinness beat). The map's end frame is almost featureless (Shanxi interior) — add province borders or terrain before production. Hard cuts everywhere; add 8-frame dissolves.
- Loudness: first mix measured mean −31.8 dB; the final mix (loudnorm I=-16) measures mean −16.9 dB, peak −1.1 dB.
- Commons status at hand-off: only `Fogong Pagoda 1.jpg` (CC BY 2.0, 768×1024) came through; `upload.wikimedia.org` answered 429 to every other download even at one request per 2 minutes (shared proxy IP). It is used for the Guinness beat; the dougong close-up and the panoramio full-height shot are wired into `assemble.sh` and will drop in on the next run once `dl/commons/retry.sh` gets them.

## Verdict on the lane
Technically everything in the pipeline runs on CPU for ≈$0.20 + ~1,000 TTS credits per minute of sample (full video TTS ≈ 11.5k credits — above this agent's cap; use OpenAI TTS or an owner-approved ElevenLabs run). The script is fully sourced and says on screen which numbers are legend. The binding constraint is **licensed imagery of the actual site**: 1 Pexels photo + 4 CC BY Commons photos + optional CC BY-SA set. For an architecture-mechanism explainer that is survivable (Ancient Architects does exactly this with stills + diagrams), for a scenery channel it is not. Recommendation in script.md §6.
