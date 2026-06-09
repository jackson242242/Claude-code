---
description: Refresh Fan Footage tourist-videos.json from Pexels and push the update
---

You are running the **hourly Fan Footage refresh** for Matchday26.
Fetch up to 12 sports/travel videos from Pexels, write `src/data/tourist-videos.json`,
verify the build, then commit and push the updated data file.

**Content rules (hard):** Pexels results are filtered by sports/travel queries only
(`soccer fans`, `stadium crowd`, `city travel` × host-city names). Do not modify the
query set to pull unrelated footage. Pexels licence requires the `sourceUrl` attribution
link to be preserved in the JSON — the script handles this automatically.

## Preconditions (owner-granted — if ANY are missing, STOP and report exactly what to add)

1. **`PEXELS_API_KEY`** present in the environment Variables (a secret — never paste the
   key in chat or commit it to the repo). Free key: <https://www.pexels.com/api/>
2. **`api.pexels.com`** on the environment network allowlist (Network access → Custom,
   add `api.pexels.com`, or set Full).

If either precondition is not met, report the exact missing item and stop — do not
attempt to run the script.

## Steps

1. **Verify preconditions** — confirm `PEXELS_API_KEY` is set and `api.pexels.com` is
   reachable (check env; do not print the key value).

2. **Run the refresh script:**
   ```
   node scripts/refresh-tourist-videos.mjs
   ```
   If the script exits non-zero (network error, bad key, zero results), report the error
   output verbatim and stop — do not commit a broken or empty JSON file.

3. **Build check:**
   ```
   npm run build
   ```
   If the build fails, report the error and stop.

4. **Commit and push `src/data/tourist-videos.json` only:**
   ```
   git add src/data/tourist-videos.json
   git commit -m "data: refresh tourist-videos from Pexels ($(date -u +%Y-%m-%dT%H:%M)Z)"
   git push
   ```
   Do NOT stage or commit any other files. Do NOT amend previous commits.

5. **Report** the number of videos written, the git commit SHA, and confirm the push
   succeeded.
