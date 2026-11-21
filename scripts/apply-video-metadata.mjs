#!/usr/bin/env node
/**
 * Apply retrofitted metadata to published videos (persona rollout, owner 2026-08-09).
 * Resumable: reads automation/youtube/state/metadata-retrofit-queue.json, applies
 * videos.update (50 quota units each) for items with status "pending", marks them
 * "done"/"failed", stops cleanly on quota exhaustion so a later run can continue.
 *
 * Usage: NODE_USE_ENV_PROXY=1 node scripts/apply-video-metadata.mjs [--limit N]
 */
import { readFile, writeFile } from 'node:fs/promises';

const QUEUE = 'automation/youtube/state/metadata-retrofit-queue.json';
const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) { console.error('missing YOUTUBE_* env'); process.exit(1); }

const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[i + 1];
const limit = Number(args.limit || 999);

const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }),
})).json();
if (!tok.access_token) { console.error('token refresh failed', tok); process.exit(1); }

const queue = JSON.parse(await readFile(QUEUE, 'utf8'));
let done = 0, failed = 0, quotaHit = false;
for (const v of queue.videos) {
  if (v.status !== 'pending' || done >= limit) continue;
  const res = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
    method: 'PUT', headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: v.videoId, snippet: {
      title: v.title, description: v.description, tags: v.tags,
      categoryId: v.categoryId, defaultLanguage: 'en',
    } }),
  });
  const body = await res.json();
  if (res.ok) { v.status = 'done'; v.appliedAt = new Date().toISOString(); done++; }
  else {
    const reason = body.error?.errors?.[0]?.reason || body.error?.message || res.status;
    if (String(reason).toLowerCase().includes('quota')) { quotaHit = true; console.error('QUOTA exhausted — stopping, queue keeps remaining as pending'); break; }
    v.status = 'failed'; v.error = String(reason).slice(0, 200); failed++;
    console.error(`FAIL ${v.videoId}: ${v.error}`);
  }
}
await writeFile(QUEUE, JSON.stringify(queue, null, 1));
const pending = queue.videos.filter(v => v.status === 'pending').length;
console.log(JSON.stringify({ done, failed, pending, quotaHit }));
