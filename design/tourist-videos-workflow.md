# Fan Footage — Tourist Videos Workflow

> How `src/data/tourist-videos.json` is kept up-to-date with fresh Pexels content,
> and what the owner must grant for either mechanism to work.

---

## Owner grant (required for both mechanisms)

| What | How to add |
|---|---|
| **Free Pexels API key** | Sign up at <https://www.pexels.com/api/> — free, licence-clear for web use. Add it as environment secret `PEXELS_API_KEY` (Variables in env settings). Never paste the key in chat or commit it to the repo. |
| **Network allowlist — `api.pexels.com`** | In your Claude Code environment settings → Network access → Custom → add `api.pexels.com` (or set Full). Without this, all fetch calls to Pexels are blocked. |

Both items are required for either mechanism below. Neither can be tested in this
sandbox — they take effect only in the owner's live environment.

---

## Mechanism A — Runtime Next.js ISR (recommended)

The provider (e.g. `src/services/touristVideos.ts` or a Route Handler) calls the
Pexels API **at request time** with `revalidate: 3600` in the fetch options:

```ts
const res = await fetch('https://api.pexels.com/videos/search?…', {
  headers: { Authorization: process.env.PEXELS_API_KEY! },
  next: { revalidate: 3600 },   // Next.js ISR — re-fetch at most once per hour
});
```

**Result:** content is automatically hourly-fresh without any commit, no redeploy,
and no Routine. The data lives in Next.js's fetch cache, not in the JSON file.

**Pros:**
- Zero commit spam; no build-minute consumption.
- Cache is invalidated automatically; stale-while-revalidate keeps responses fast.
- The `src/data/tourist-videos.json` seed file is only used as a fallback when the
  API key is absent (dev / CI without credentials).

**Cons:**
- Requires `PEXELS_API_KEY` and `api.pexels.com` to be live in the **production**
  environment (Render, Vercel, etc.) — not just in the Claude Code sandbox.
- ISR cache is not persistent across cold-start; first post-deploy request re-fetches.

**This is the recommended path** — no moving parts beyond the env var and allowlist.

---

## Mechanism B — Hourly Routine + `/refresh-tourist-videos`

A Routine created at <https://claude.ai/code/routines> runs `/refresh-tourist-videos`
on a schedule. The skill:

1. Calls `node scripts/refresh-tourist-videos.mjs` → writes fresh JSON.
2. Runs `npm run build` to verify the output is valid.
3. Commits `src/data/tourist-videos.json` and pushes to the branch.

**Result:** The repo contains a committed snapshot of the latest Pexels results,
and every push triggers a redeploy (e.g. Render auto-deploy from the branch).

**Pros:**
- Works with a purely static export (no server-side fetch at runtime).
- The committed JSON is auditable / diffable in git history.

**Cons:**
- **Redeploys hourly** — on Render's free tier this consumes build minutes quickly.
  Consider setting the Routine to every **6 hours** instead of 1 hour to stay within
  the free-tier monthly budget.
- Requires the Claude Code environment to have `PEXELS_API_KEY` + `api.pexels.com`
  allowlisted (the sandbox, not just production).
- Routine must be created manually by the owner at <https://claude.ai/code/routines>
  — agents cannot create Routines on the owner's behalf.
- Any script error (bad key, network block, zero results) stops the commit; the
  Routine will retry on the next interval.

**How to set up:**
1. Grant `PEXELS_API_KEY` + allowlist `api.pexels.com` in your Claude Code env.
2. Go to <https://claude.ai/code/routines> → New Routine → command `/refresh-tourist-videos` → interval `6h` (recommended) or `1h`.
3. The Routine agent handles the rest each cycle.

---

## Honest limitations

- Neither mechanism has been run in this sandbox (no live API key or network access
  here). The script and command were written to the Pexels API spec and will work
  once the owner grants the two items above.
- Pexels free tier has rate limits. The script caps results at 12 videos and makes
  one request per city/topic pair (≤ 16 requests per run) — well within free limits.
- Pexels licence requires attribution: `sourceUrl` linking back to the original
  Pexels asset page is preserved in every `TouristVideo` record automatically.
