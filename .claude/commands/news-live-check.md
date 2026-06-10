---
description: 6-hourly retest + re-confirm live World Cup news on production (majordomo check)
---

You are the **majordomo** (主控/orchestrator) running the **6-hourly live-news
check** for Matchday26. Goal: prove the test suite is still green and that live
World Cup news is actually flowing on production, refresh the feeds if it isn't,
and record + report a one-line confirmation.

> Cadence: every 6 hours (cron `0 */6 * * *`). This is a **deterministic script**
> — one bounded pass, gated, with state written back. The repo is the only
> cross-run memory.

## Production URLs
- Web: `https://worldcup-web-03eq.onrender.com`
- News health probe: `GET /api/news/health` → `{ live, source, locale, liveCount, total, checkedAt }`

## Steps

1. **Retest (offline, hard gate).** Run, and capture pass/fail:
   ```
   npm run typecheck && npm test && npm run lint && npm run build
   cd backend && .venv/bin/python -m pytest -q ; cd ..
   ```
   If anything fails, STOP after this step and report the failure verbatim — do
   not touch production on a red suite.

2. **Confirm live news on production.** Hit the probe (default + the ES/FR
   locales):
   ```
   curl -fsS https://worldcup-web-03eq.onrender.com/api/news/health
   curl -fsS "https://worldcup-web-03eq.onrender.com/api/news/health?locale=es"
   curl -fsS "https://worldcup-web-03eq.onrender.com/api/news/health?locale=fr"
   ```
   - `live:true` with a `source` and `liveCount ≥ 3` → news is flowing. ✅
   - `live:false` → the deployed app fell back to the seed (a feed is
     down/blocked). Go to step 3.
   - **If the curl itself fails** (this environment's network policy blocks
     `onrender.com`): say so honestly, fall back to the offline signal (step 1's
     `newsService` parser tests passing = the code path is healthy), and ask the
     boss to eyeball the green **Live** pill on `/news`. Do NOT claim production
     is live if you couldn't reach it.

3. **Re-attach / fix (only if needed).**
   - If a feed is failing, open `src/services/newsService.ts` and reorder/replace
     the failing source in `EN_FEEDS` / `FEEDS_BY_LOCALE` with a working keyless
     football RSS, keeping the seed fallback. Re-run step 1's gates.
   - If `PEXELS_API_KEY` + `api.pexels.com` are available, also run
     `/refresh-tourist-videos` to refresh the fan-footage cache.
   - Deploy by squash-merging the dev branch `claude/vigilant-cannon-emAjf` into
     the deploy branch `claude/zombie-spawner-waves-2l6Vb`, pushing, then
     realigning the dev branch (`reset --hard` to the deploy branch). Only push
     when all gates are green and the diff is bounded.

4. **Confirm with the majordomo (write-back + report).** Append one dated line to
   `marketing/ops-news-live.md` (create it if missing) in this format:
   ```
   - YYYY-MM-DDTHH:MMZ · retest: PASS|FAIL (N FE / M BE) · prod news: live(<source>, liveCount)|fallback|unreachable · action: none|<what changed> · deploy: <sha>|n/a
   ```
   Then report the same one-liner back to the boss. If `live:false` persisted
   after a fix attempt, say so plainly and name the failing feed.

5. **Escalate on failure (GitHub issue ping).** Decide severity:
   - **RED** = step-1 retest FAILED, **or** the probe confirmed prod `live:false`
     (a real feed outage on production) and step-3's fix did not recover it.
   - `unreachable` (this env can't reach `onrender.com`) is **NOT** an alert on
     its own — it's an environment limit; just log it.

   On **RED**, ping the boss via the **GitHub MCP issue tools** (repo
   `jackson242242/claude-code`), de-duplicating so we never spam:
   1. `mcp__github__search_issues` for an **open** issue titled
      `⚠️ Live-news health alert` (label `ops`, `live-news`).
   2. If one exists → `mcp__github__add_issue_comment` with the failing
      one-liner + details (which gate failed / which feed is down + probe JSON).
   3. If none exists → `mcp__github__issue_write` to create
      `⚠️ Live-news health alert` with the one-liner, the failing detail, and a
      pointer to `marketing/ops-news-live.md`.

   On a **GREEN** run (retest PASS **and** prod `live:true`) when an open
   `⚠️ Live-news health alert` issue exists → comment `✅ Recovered <ISO> —
   <source>, liveCount` and **close** it (`mcp__github__issue_write`). This keeps
   exactly one open issue that opens on failure and closes on recovery.

## Guardrails
- Never push on a red suite. Keep the diff bounded (feeds/cache only).
- Honesty: if production was unreachable from this environment, report
  "unreachable — verify the Live pill", never a fabricated "live".
- One rolling alert issue — comment on the open one, don't open duplicates.
- Don't paste secrets (PEXELS/Anthropic keys) into chat or commits.
