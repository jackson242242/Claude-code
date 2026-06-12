# `ops/` — Agent Operations & Memory

This folder is the agent team's **cross-run memory**. Sessions are ephemeral ("amnesiac"),
so these Markdown docs — not chat history — are the source of continuity. Every scheduled
run reads the relevant doc first and writes progress back last. (Code and developer docs
stay at the repo root; this folder is operations/memory only.)

| Doc | Purpose | Read/write cadence |
|---|---|---|
| `CADENCE.md` | Deterministic playbook / upgrade cadence + backlogs | every product/design cycle |
| `PROJECTS.md` | Majordomo's portfolio ledger (one entry per project) | every `/pm-cycle` |
| `MEMORY.md` | Long-term decision log / status snapshots | on notable decisions |
| `TEAM.md` | Agent roster, governance, voting rules | when the team/rules change |
| `DESIGN.md` | Design "constitution" (tokens, aesthetic direction) | every design cycle |
| `BRAND.md` | Product/brand strategy (docs only; no code) | when strategy shifts |

Slash-command playbooks live in `.claude/commands/*`; the portfolio coordinator is
`.claude/agents/majordomo.md`. The workspace constitution and per-project docs are the
`CLAUDE.md` files (root + each project folder).
