# Live News — 6-Hourly Health Log

> Append-only log written by the `/news-live-check` command (cron `0 */6 * * *`).
> One line per run. Format:
> `- <ISO> · retest: PASS|FAIL (N FE / M BE) · prod news: live(<source>, liveCount)|fallback|unreachable · action: none|<change> · deploy: <sha>|n/a`
>
> Note: agent environments (sandbox/routine) may have `onrender.com` off the
> network allow-list — when the probe can't be reached, the run records
> `unreachable` and the boss verifies the green **Live** pill on `/news`. The
> deployed app fetches live news itself (open egress), so production is
> unaffected by the agent's reachability.

- 2026-06-10T04:06Z · retest: PASS (153 FE / 62 BE) · prod news: unreachable (sandbox allow-list blocks onrender) · action: none — shipped /api/news/health probe + this check · deploy: 11bc9f2
- 2026-06-10T09:40Z · retest: PASS (153 FE / 62 BE) · prod news: unreachable (sandbox allow-list blocks onrender) · action: none (run via /pm-cycle) · deploy: n/a
