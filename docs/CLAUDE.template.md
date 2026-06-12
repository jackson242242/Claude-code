<!--
  CLAUDE.md TEMPLATE — copy this to bootstrap docs for a new repo or sub-project.

  How to use:
  • New standalone repo  → copy to ./CLAUDE.md, keep the GENERIC half verbatim,
                           fill the PROJECT half.
  • New sub-project here → copy to <project>/CLAUDE.md, DELETE the GENERIC half
                           (the root CLAUDE.md already carries it), fill the
                           PROJECT half, and add a one-line pointer back to root.
  Replace every <ANGLE_BRACKET> placeholder. Delete guidance comments when done.
-->

# <WORKSPACE OR PROJECT NAME> — Guide for AI Assistants

> These instructions OVERRIDE default behavior — follow them, and keep them current.
> When you change structure, commands, or conventions, update this file in the same change.

<!-- ===================== GENERIC CONSTITUTION (reusable verbatim) ===================== -->

## Operating Principles
- **Keep it simple:** fewest steps to the goal; don't over-engineer.
- **Act autonomously:** if you can decide and finish it yourself, do it — don't over-confirm.
- **Don't act on what you don't understand:** unclear details → investigate, think, plan, *then* change.
- **Honesty first:** never inflate or fake completion; if you can't / aren't sure / it's out of scope, say so (report failures with their output).
- **Gates & reversibility:** pass the gates before "done"; think before user-facing or irreversible changes — preview or get sign-off when warranted.

## Universal Conventions & Quality Gates
- **Gates before "done":** run lint, type-check, build, and tests before claiming complete. On failure, say so with the output.
- **Tests mirror source:** new features ship with tests whose filenames mirror the source, in the project's test dir.
- **Source-of-truth discipline:** update a declared source of truth (e.g. a schema file) *before* the code that derives from it.
- **No phantom data:** reuse the existing mock/seed/fixture layer; don't invent parallel dummy data.
- **Don't leak secrets:** diagnostics, health endpoints, and logs must never echo credentials.
- **Commit/PR discipline:** branch off default unless told otherwise; commit/push only when asked; no PR unless explicitly requested.

<!-- ===================== PROJECT-SPECIFIC (fill in the blanks) ===================== -->

## Overview
- **Product:** <ONE-LINE WHAT IT IS>
- **Core goal:** <PRIMARY USER OUTCOME>
- **Status:** <live / prototype / where it runs; fallback behavior if any>

## Tech Stack
- **Frontend:** <framework + language, or "n/a">
- **Backend:** <framework + language, or "n/a">
- **Data:** <db / storage; dev fallback>
- **Tests:** <frameworks>
- **What NOT to use:** <banned deps / patterns, e.g. no Axios, no global store, no `any`>

## Layout
```
<DIR>/   <what lives here>
<DIR>/   <what lives here>
```
<!-- Note any path aliases, e.g. @/* -> src/* -->

## Commands
- **Install:** <...>
- **Dev:** <... + URL>
- **Tests:** <...>
- **Lint / Types / Build:** <...>
- **CI:** <what the pipeline runs>

## Architecture & Code Placement
- **Routing / entry:** <where routes/handlers live>
- **Business logic:** <where it goes; keep it out of UI/components>
- **Integrations / adapters:** <provider/registry pattern, env-driven selection, fallbacks>
- **State / persistence:** <how data is stored and selected>
- **Contract:** <JSON/type contract between layers and how it's kept in sync>

## Conventions & Guardrails
- **Naming / style:** <...>
- **Types:** <...>
- **Error handling:** <single handler / error shape>
- **Hard rules:** <breaking-change guards, source-of-truth, separation from sibling projects>
