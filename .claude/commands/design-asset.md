---
description: Generate a festival design image via OpenAI Images and wire it into the app
---

You are generating a real design asset for **Matchday26** with the OpenAI Images API
(not just CSS). Follow `DESIGN.md` and `design/moodboard-workflow.md`.

## Preconditions (owner-granted — if missing, STOP and report exactly what to add)
- `OPENAI_API_KEY` present in the environment (a secret, never pasted in chat).
- Host `api.openai.com` on the environment network allowlist (Network access → Custom, or Full).

## Steps
1. **Craft the prompt** from the festival direction (DESIGN.md emotional anchor + moodboard
   directions in `design/moodboard-workflow.md`). Style: dark, cinematic, teal `#1fb88f`
   pitch glow + warm `#FF6B35` stand light; clean, premium.
   **Content rules (hard):** NO real logos/trademarks (FIFA / "World Cup" marks / club crests),
   NO real player likenesses, NO flags used in official/political framing, NO political or legal
   content. Generic stadium / fans / city / festival imagery only.
2. **Generate:**
   `node scripts/generate-asset.mjs --prompt "…" --out public/images/<name>.webp --size 1536x1024 --quality medium`
   (Cost is incurred on the owner's OpenAI account — keep iterations lean.)
   If it fails on a missing key / blocked host, STOP and tell the owner the exact fix.
3. **Wire it in** (e.g., hero background): keep text contrast ≥ WCAG AA over the image by adding a
   dark scrim/overlay; behind `prefers-reduced-motion` if it animates; provide a static fallback.
4. **Gates:** `npm run typecheck && npm test && npm run lint`.
5. **Commit + push + open PR; do NOT merge** — main control / owner reviews the artwork before it
   ships (generated imagery is a judgment call). Note in the PR that API cost was incurred.
