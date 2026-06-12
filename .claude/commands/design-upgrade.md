---
description: Run one Design Upgrade cycle per CADENCE.md (on-demand since 2026-06-10; Sheng→龙哥→impl)
---

You are running a **Design Upgrade** cycle for the Matchday26 project
(on-demand — the 24h schedule was retired by the boss on 2026-06-10; this runs
when the boss or /pm-cycle triggers it).
Follow `ops/CADENCE.md` exactly (agent docs live in `ops/`). Fresh session — the repo is your
only memory.

Steps (per CADENCE.md §2 & §6):
1. **Read state**: `CADENCE.md` (§6 Design Roadmap), `MEMORY.md` (§5 design
   direction). Pick the SINGLE top roadmap item. One step per run.
2. **Propose (Sheng)**: produce the concrete spec. Per 龙哥's KPI, lead with the
   emotional anchor ("this screen should make the user feel ___") BEFORE pixels,
   then exact hex/px/CSS.
3. **Review (龙哥)**: critique from art + entertainment-ops angle; score aesthetics
   and communication efficiency (X/10) and require fixes before landing.
4. **Implement** with an implementation subagent (accessibility-safe; e.g. WCAG AA
   ≥4.5:1 for text). Keep additive and within the agreed roadmap.
5. **Gates (must pass)**: `npm run typecheck`, `npm test`, `npm run lint`.
6. **Safety (CADENCE.md §3)**: in-scope design-token/visual iteration that is green
   → open PR to deploy branch and merge. Anything touching brand identity, pricing,
   or irreversible/legal items → PR + STOP for owner/vote.
7. **Write state back**: tick the done item in `CADENCE.md` §6, note next step,
   update `MEMORY.md`. Mandatory.
8. End with a one-line PR summary including 龙哥's scores.

One roadmap step per run. Park extra ideas in the roadmap for the next cycle.
