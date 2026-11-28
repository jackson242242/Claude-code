# M-Long #2 (Forbidden City Drainage) — SLIPPED from 2026-11-27 to 2026-12-11

**Decision (2026-11-27 routine, honest degrade per §4L):** the M-Long was NOT produced
today; it slips to the next M-Long Friday (2026-12-11). The 4 daily Shorts shipped as normal.

## Why (honest)
- §4L M-Long requires the Sunday manager session to commit the full asset set, INCLUDING
  the diagram renderer. For forbidden-city-drainage the renderer `scripts/mechanism/
  render_diagrams_fcdrain.py` does NOT exist — `plans/mechanism/forbidden-city-drainage/
  scenes.json` is only a 4-scene SPEC plus a `_note` saying "write
  render_diagrams_fcdrain.py by copying render_diagrams_yingxian.py primitives." (Contrast
  11-13 Yingxian, whose `render_pagoda.py` was pre-built and ready.)
- Building AND validating a brand-new 4-scene 16:9 animated SVG renderer (tilted exaggerated
  ground slope, 3-tier terrace + sequenced dragon spouts, courtyard ditches→culverts, bow
  Golden Water River + 5 bridges + moat), with every on-screen number matching the ledger and
  nothing overlapping the subtitle band (y<1260), PLUS re-verifying the 20-claim ledger to 2
  sources each (most hosts proxy-blocked), PLUS a beat-keyed assembly + thumbnail + 3 child
  briefs — to a non-padded, accurate 10–14 min standard — could not be completed to the
  channel's honesty bar with confidence in the same run as the 4 Shorts.
- §4L: "If the text assets are missing ... slip the M-Long to the next M-Long Friday, log it,
  and run that day as a normal Shorts day (never a padded video)." and "never publish a weak
  guide to fill a Friday." Slipping is the designed fallback, not a failure.

## Action for the Sunday weekly-manager session (before 2026-12-11)
1. Write & commit `scripts/mechanism/render_diagrams_fcdrain.py` (4 scenes per scenes.json,
   16:9 1920x1080 30fps, palette = render_fc_drain.py C{} dict, copy render_diagrams_yingxian.py
   primitives; keep y<1260 clear for subtitles; every number matches longform-script.md §2).
2. Confirm the 20-claim ledger is re-sourceable (2 sources each) at render time.
3. Then 2026-12-11 renders normally: narration (OpenAI marin, ~$0.27, log spend), assembly on
   slug-named Forbidden City photos + the 4 diagram scenes + text cards, thumbnail, 3 child
   M-Shorts scheduled over the following 7 days, upload 15:00Z fmt:L lane:M-Long.

Assets present and ready: longform-script.md (10:40, 20-claim ledger), scenes.json (spec),
thumbnail-spec.md, child-shorts.md. Only the renderer is missing.
