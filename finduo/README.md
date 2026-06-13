# FinDuo 🐷 — Learn Money (and more), One Lesson a Day

A **Duolingo-style learning game** for the skills that decide whether you thrive
or struggle in the modern world. It starts with **personal finance** — the most
under-taught, highest-impact life skill — and is architected to grow into many
domains (ML, deep learning, LLMs, AI agents, private equity, art, design).

> 💚 The mission: *fight financial (and modern-skill) illiteracy so fewer people
> get left behind.*

## What's here

| File | What it is |
|---|---|
| `index.html` | The full app — open it in any browser. No install, no internet, no signup. |
| `LEARNING_FRAMEWORK.md` | The **backbone**: value system, learning architecture, the 6-tier mastery ladder, all 8 domain tracks, and a multi-year long-term plan. Read this first to understand *why* the courses are shaped the way they are. |

## Run it

Just open `index.html` (works great on a phone too). Everything saves to your
browser. Tap a lesson to start.

## Features (Duolingo-style)

- **Skill path** with units, lessons, and locking (no skipping ahead).
- **Multiple exercise types:** multiple choice, true/false, type-the-answer,
  select-all, and match-the-pairs.
- **Gamification:** XP, hearts ❤️ (with refill), daily goal ring 🎯,
  streaks 🔥, levels ⭐, leagues 🏆, and achievement badges 🏅.
- **Share your progress** with the world: generates a shareable image card
  (post to Instagram/WhatsApp/X) via the Web Share API, with download +
  copy-text fallbacks.
- **Live curriculum:** a complete 6-unit / 12-lesson **Personal Finance** course
  (budgeting → saving → debt & credit → compound interest → money traps →
  growing wealth).

## About "share with the whole world" 🌍 (honest note)

Today FinDuo runs **100% in your browser**, so it works instantly and privately —
but that means the leaderboard's other learners are friendly **simulated demo
players**, and your share card is an **image you post yourself**. Real
worldwide, real-time ranking needs a small backend server.

That extension is deliberately easy: all progress reads/writes go through a
single `Store` object in `index.html`. Swapping its localStorage calls for an
API (e.g. `POST /xp`, `GET /leaderboard`, a public profile page) turns the demo
league into a real global one. The surrounding repo already uses **FastAPI +
PostgreSQL**, so the same pattern drops right in. (See Profile → "How global
sharing works" in the app.)

## Extending to new tracks

The app's data shape is `CURRICULUM → unit → lesson → exercises`. To add a new
subject (say, Machine Learning), author its units/lessons in that same shape and
tag each unit with a **tier** from `LEARNING_FRAMEWORK.md` — the engine handles
the path, locking, scoring, sharing, and leagues automatically. The framework is
the authoring spec.
