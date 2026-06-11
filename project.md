# Project Status

## PR Summary
_Last updated: 2026-06-11 18:30 UTC_

### Open Pull Requests

| # | Title | Author | Open Since |
|---|-------|--------|------------|
| #31 | Add Thomas English meal counter web app | jackson242242 | ~18h ago (2026-06-10 23:50 UTC) |
| #29 | VoiceMemoBot: transcription, comments, users/follows, DMs, forwarding, livestream concerts | jackson242242 | ~24h ago (2026-06-10 18:13 UTC) |
| #1 | Add CLAUDE.md with codebase guidance for AI assistants | jackson242242 | ~18 days ago (2026-05-24 15:33 UTC) |

### PRs Merged in the Last 6 Hours

| # | Title | Author | Merged At |
|---|-------|--------|-----------|
| #35 | pm-cycle 2026-06-11 18:30Z: live-strip match phases + news check + portfolio write-back | jackson242242 | 2026-06-11 18:14 UTC |
| #34 | pm-cycle 2026-06-11 12:20Z: pre-kickoff research + news check + portfolio write-back | jackson242242 | 2026-06-11 12:11 UTC |

---

## Release Notes

### Improved — Live Match Strip: Real-Time Phase Display (2026-06-11)

The Today's Matches strip now shows the live phase of each match during the tournament. Matches currently in progress appear with a red highlighted border and an "In progress" label; finished matches display "FT" in a dimmed style; and upcoming matches continue to show their scheduled kickoff time. Phase is derived from the live schedule feed's `status` field when the feed is configured, and falls back to an honest kickoff-time window estimate (2¼ hours for group stage, 3¼ hours for knockout rounds including extra time and penalties) when it is not. Note: final scores are not yet shown — that requires activating the schedule feed and extending the match data model.
