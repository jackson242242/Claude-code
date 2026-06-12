---
description: Run one SkyEmpire (airline-game) milestone cycle per airline-game/ROADMAP.md
---

You are running one **SkyEmpire 里程碑推进** cycle for the airline tycoon web game.
This is an autonomous routine run: the session is fresh, the repo is your only memory.
The project lives on branch `claude/airline-tycoon-dynamic-events-ps9if8` — all work
and pushes go there (it should be the session's working branch).

Steps:
1. **Read state**: `airline-game/ROADMAP.md` (backlog + 红线), `airline-game/CONTRACT.md`,
   `docs/airline-tycoon-plan.md`. Pick the SINGLE topmost actionable backlog item.
   One item, bounded diff. If the top item is blocked (e.g. 素材本地化 waiting on the
   network allowlist), note why and take the next one.
2. **Contract first**: if the item changes API shapes or economy formulas, amend
   `airline-game/CONTRACT.md` before writing code.
3. **Implement** within `airline-game/` only. Engine stays pure-function; frontend
   stays TS-strict/no-any/no-Redux/no-Axios; reuse `airline-game/data/` as the single
   source of truth (no phantom data files).
4. **Gates (must ALL pass, else the item is not done — fix or revert)**:
   - `cd airline-game/api && .venv/bin/python -m pytest`（venv 不存在则先按 api/README.md 建）
   - `cd airline-game/web && npm run lint && npm run typecheck && npx jest && npm run build`
   - root `npm run typecheck` still green (airline-game is excluded; keep it that way).
5. **Write state back**: tick the item in `airline-game/ROADMAP.md` with one line of
   evidence (commit hash, test counts), adjust next-item notes if reality changed.
   This is cross-run continuity — never skip.
6. **Commit & push** to `claude/airline-tycoon-dynamic-events-ps9if8` with a clear
   message. Do NOT create a PR unless the boss asked. Do NOT touch PROJECTS.md /
   briefs/ (majordomo's ledger) or any code outside `airline-game/` + this command file.
7. End with a one-line summary: 做了什么 / 门禁 / 下一项.

Do not sprawl beyond one backlog item. New ideas go into ROADMAP.md backlog instead.
