# Project Status

## PR Summary
_Last updated: 2026-06-11 ~12:20Z (scheduled 6-hour summary)_

### Open Pull Requests

| # | Title | Author | Open Since |
|---|-------|--------|------------|
| [#31](https://github.com/jackson242242/Claude-code/pull/31) | Add Thomas English meal counter web app | @jackson242242 | ~12.5h (2026-06-10 23:50Z) |
| [#29](https://github.com/jackson242242/Claude-code/pull/29) | VoiceMemoBot: transcription, comments, users/follows, DMs, forwarding, livestream concerts | @jackson242242 | ~18h (2026-06-10 18:13Z) |
| [#1](https://github.com/jackson242242/Claude-code/pull/1) | Add CLAUDE.md with codebase guidance for AI assistants | @jackson242242 | ~18 days (2026-05-24 15:33Z) |

> **Note on #29:** Has merge conflicts (confined to two ledger files: `PROJECTS.md` and `briefs/latest.md`). VoiceMemoBot code itself is conflict-free. Boss action required to merge.

### Merged in the Last 6 Hours

| # | Title | Author | Merged At |
|---|-------|--------|-----------|
| [#34](https://github.com/jackson242242/Claude-code/pull/34) | pm-cycle 2026-06-11 12:20Z: pre-kickoff research + news check + portfolio write-back | @jackson242242 | 2026-06-11 12:11Z |
| [#33](https://github.com/jackson242242/Claude-code/pull/33) | pm-cycle 2026-06-11 06:15Z: opening-day LIVE hero strip + news check + portfolio write-back | @jackson242242 | 2026-06-11 06:13Z |

---

## Release Notes

### New — Opening-day LIVE hero strip (2026-06-11)

When the World Cup kicks off, the home page hero now automatically switches to a live-tournament mode: a pulsing LIVE badge appears alongside a compact strip of today's matches showing flags, teams, local kickoff times, and venue links. The strip is active from opening day (June 11) through the day after the July 19 final, then retires automatically. Fully accessible — the animation is disabled under `prefers-reduced-motion`.

### New — Real schedule data overlay (2026-06-10)

The match schedule can now be backed by a live fixture feed: set `SCHEDULE_FEED_URL` on Render to an external JSON source and the app will overlay real teams, kickoff times, and results on top of the seed data, with a 6-hour cache and automatic fallback to seed data if the feed is unavailable. No URL set = no behavior change.
