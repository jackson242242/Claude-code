---
description: Run one 12-hour Product Upgrade cycle per CADENCE.md (Hao-led)
---

You are running the **12-hour Product Upgrade** cycle for the Matchday26 project.
Follow `CADENCE.md` in the repo root exactly. This is an autonomous routine run:
the session is fresh, so the repo is your only memory.

Steps (per CADENCE.md §2):
1. **Read state**: `CADENCE.md` (§5 Product Backlog), `MEMORY.md` (§ todos), `BRAND.md`.
   Pick the SINGLE top actionable backlog item. One item, bounded diff.
2. **Implement** it as 浩哥 (tech/infra lead) with an implementation subagent.
   Keep it small, additive, reversible.
3. **Gates (must pass, else do not merge)**: `npm run typecheck`, `npm test`,
   `npm run lint`; if backend touched, `cd backend && .venv/bin/python -m pytest`.
4. **Safety (CADENCE.md §3)**: if the change is in the ✅ safe scope AND gates are
   green → open a PR to the default/deploy branch and merge it. If it hits any 🛑
   carve-out (brand, pricing, schema/DB, new infra, deletions, secrets, legal) →
   open a PR and STOP; do NOT merge; explain and defer to owner/vote.
5. **Write state back**: tick the done item in `CADENCE.md` §5, add a "next round"
   note, update `MEMORY.md`. Do not skip — this is cross-run continuity.
6. End with a one-line PR summary: what / gates / shipped? / next.

Do not sprawl beyond one backlog item. Extra ideas go into the backlog for next run.
