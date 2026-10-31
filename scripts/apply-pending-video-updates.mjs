#!/usr/bin/env node
/**
 * Apply state/pending-video-updates.json retitles ONCE (search-intent retitles for
 * L01/L02). Fetches each video's current snippet, replaces ONLY the title (keeps
 * description/tags/categoryId/defaultLanguage), applies videos.update, moves entry to "done".
 * Usage: NODE_USE_ENV_PROXY=1 node scripts/apply-pending-video-updates.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
const FILE = 'automation/youtube/state/pending-video-updates.json';
const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) { console.error('missing YOUTUBE_* env'); process.exit(1); }

const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }),
})).json();
if (!tok.access_token) { console.error('token refresh failed', tok); process.exit(1); }
const auth = { Authorization: `Bearer ${tok.access_token}` };

const data = JSON.parse(await readFile(FILE, 'utf8'));
data.done = data.done || [];
const still = [];
for (const item of data.pending) {
  const list = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${item.videoId}`, { headers: auth })).json();
  const sn = list.items?.[0]?.snippet;
  if (!sn) { console.error(`SKIP ${item.videoId}: not found`); still.push(item); continue; }
  const oldTitle = sn.title;
  sn.title = item.title;
  const res = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
    method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: item.videoId, snippet: {
      title: sn.title, description: sn.description, tags: sn.tags,
      categoryId: sn.categoryId, defaultLanguage: sn.defaultLanguage || 'en',
    } }),
  });
  const body = await res.json();
  if (res.ok) { console.log(`RETITLED ${item.videoId}\n  from: ${oldTitle}\n  to:   ${item.title}`); data.done.push({ ...item, oldTitle, appliedAt: new Date().toISOString() }); }
  else { console.error(`FAIL ${item.videoId}: ${body.error?.message || res.status}`); still.push(item); }
}
data.pending = still;
await writeFile(FILE, JSON.stringify(data, null, 1));
console.log(JSON.stringify({ done: data.done.length, pending: data.pending.length }));
