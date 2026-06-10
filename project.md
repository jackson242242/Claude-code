# Project Status

## PR Summary
_Last updated: 2026-06-10 18:25 UTC (scheduled 6-hour summary)_

### Open PRs

| # | Title | Author | Open since |
|---|-------|--------|------------|
| [#29](https://github.com/jackson242242/Claude-code/pull/29) | VoiceMemoBot: transcription, comments, users/follows, DMs, forwarding, livestream concerts | jackson242242 | 2026-06-10 (~12 min) |
| [#1](https://github.com/jackson242242/Claude-code/pull/1) | Add CLAUDE.md with codebase guidance for AI assistants | jackson242242 | 2026-05-24 (~17 days) |

### PRs Merged in Last 6 Hours

| # | Title | Author | Merged at |
|---|-------|--------|-----------|
| [#30](https://github.com/jackson242242/Claude-code/pull/30) | pm-cycle 2026-06-10 18:25Z: real-schedule feed overlay + news check + portfolio write-back | jackson242242 | 2026-06-10 18:14 UTC |

---

## Release Notes

### New · 2026-06-10

**Live match schedule data overlay** (PR #30)

The match schedule API can now display real 2026 World Cup fixture data — team names, kickoff times, venues, and completed scores — pulled from an external feed and overlaid onto the built-in seed schedule by match number. The feed is cached for 6 hours, and the app falls back gracefully to seed data if the feed is unavailable or returns an error. Activation requires setting the `SCHEDULE_FEED_URL` environment variable on the deployment; without it, behavior is unchanged.
