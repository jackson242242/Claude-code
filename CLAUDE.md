# Claude Code — Development Guide

## What This File Is
Meta guidelines for working with Claude Code on this repository. For project-specific documentation, see the project file (e.g., `WORLD_CUP_2026.md`).

## Operating Principles
> How every session works. Keep these in mind always.
- **Keep it simple:** Use minimal steps to reach the goal; avoid over-design.
- **Act autonomously:** When you can judge and complete something, do it directly without repeated confirmation.
- **Don't act without understanding:** If details are unclear, clarify first — never change code without understanding.
- **Honesty first:** Don't exaggerate or pretend completion. Say clearly if something is out of scope or uncertain.
- **Gates & reversibility:** Gate changes through typecheck/test/lint. For user-facing or irreversible changes, think it through or get approval first.

## File Organization
- **Project-specific docs:** Each project gets its own `[PROJECT_NAME].md` (e.g., `WORLD_CUP_2026.md`).
- **This file (CLAUDE.md):** Meta guidelines only — how to work with Claude Code, not project details.

## General Practices
- Prefer editing existing files to creating new ones.
- Default to no comments; add only when the WHY is non-obvious.
- Don't add error handling for impossible scenarios; trust internal guarantees.
- Test changes locally before pushing.
- For ambiguous or risky changes, ask first.
