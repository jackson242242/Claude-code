# Longform L01 — 2026-08-28 — China Visa-Free 2026 (first longform day)

**Slot:** L · **Format:** 16:9, English-only · **publishAt:** 2026-08-28T15:00:00Z
**Playbook:** plans/longform-v2.md (bible). Cadence: every 4 days from anchor 2026-08-28 → today = L01.
Topic = bible §5 schedule row L01. Voice lane UNPAUSED for longform-english only.

## Production summary
- Narration: `narration.md` → 12 sections (`section-01..12.txt`), 2091 words.
- TTS: ElevenLabs (voice = Rachel/default 21m00Tcm4TlvDq8ikWAM, eleven_multilingual_v2, script defaults).
  **Series voice = Rachel** (set here for L01; keep consistent across the series per bible §2).
- Per-section mp3s concatenated with 0.5s gaps → `vo.mp3` = 13.3 min (798.6s). Chapters computed
  from real section durations (`chapters-final.json`), first at 0:00 → in description.
- Video: assemble-video.mjs --audio vo.mp3 --format 16x9 --seg-seconds 5 --pace fast --style clean
  --music lofi-chill-01 (soft bed under VO) --badge "CHINA TRAVEL EXPERT", 28 diverse China-travel
  queries, max-clips 50. No burned subs (YouTube auto-captions per bible §7).
- Thumbnail: generate-asset.mjs (§4 template — navy + China-red, passport/warning icon, Great Wall
  silhouette, "10 DAYS, NO VISA · 2026", no faces). 136 KB (≤2MB).

## Honesty / bible compliance
- ZERO Chinese in title/description/narration/captions (verified: 0 CJK chars in title+desc). ✓
- No fabricated first-person anecdotes — used "travelers report" / rule-based framing (§2 hard rule ①). ✓
- Visa red line (contentRules + growth-v2): official facts only + explicit "verify with NIA / your
  embassy" disclaimer; NO eligibility advice. ✓
- AI-narration disclosed in description (§6). Footage = licensed Pexels stock, illustrative; no AI
  scenes depicting real places (§3). ✓
- TTS phonetic QA (§2 rule ②): risky names spelled phonetically in the TTS text — Lhasa, Ürümqi→"Urumchi",
  Zhuhai, etc. NOTE: I cannot literally audio-audition in this environment; QA was done by phonetic
  spelling of hard proper nouns rather than by ear. Flagged honestly.
- Layered map/info-card/screen-recording visuals are the bible's "later version" (§3 "录屏段后续版本");
  L01 ships script + AI VO + layered stock b-roll + original thumbnail + manual chapters. Maps/cards
  are the next longform iteration.

## Verified facts + sources (this run, WebSearch)
- 30-day unilateral visa-free: ≈50 countries (35 Europe / 7 Asia / 6 Americas / 2 Oceania), ordinary
  passports, ≤30 days, tourism/business/family/transit (NOT work/study/journalism), counts from entry,
  scheme through 2026-12-31; UK & Canada added 2026-02-17.
- 240-hour (10-day) transit: ~55 countries, 24 provinces/regions, 60+ ports; confirmed onward ticket
  to a THIRD country/region required (HK/Macau/Taiwan = separate regions); region-restricted; some
  ports (Lhasa, Ürümqi) not eligible; clock starts 00:00 the day after entry; Kyrgyzstan & Vietnam
  added 2026-08-20.
- Common voiding mistakes: unbooked onward ticket; same origin=destination; leaving the permitted
  region; entering via a non-eligible port; using visa-free for work/study/journalism.

Sources:
- https://www.chinadiscovery.com/chinese-visa/240-hour-visa-free-transit.html
- https://www.china-briefing.com/news/china-visa-free-travel-policies-complete-guide/
- https://travelchinawith.me/china-visa/30-day-visa-free-policy-in-china/
- https://www.europeanchamber.com.cn/en/national-news/3641/china_s_visa_free_policies_avoiding_common_mistakes
- https://mychina.guide/blog/china-visa-free-transit-requirements
- official reference to verify: China National Immigration Administration (nia.gov.cn)
