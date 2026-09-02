#!/usr/bin/env node
/**
 * Weekly competitor scan (owner 2026-09-02: "别的频道为什么做得好"). Uses the
 * YouTube Data API (search.list, 100 units/query) to list the top-viewed China
 * travel Shorts published in the last 7 days, then writes titles/channels/views
 * + a hook-shape tally to automation/youtube/state/competitors.md so the daily
 * run can copy winning SHAPES (not content).
 *
 * Usage: NODE_USE_ENV_PROXY=1 node scripts/yt-competitor-scan.mjs   (~600 units)
 */
import { readFile, writeFile } from 'node:fs/promises';
const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) { console.error('missing YOUTUBE_* env'); process.exit(1); }
const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }) })).json();
if (!tok.access_token) { console.error('token refresh failed', tok); process.exit(1); }
const H = { Authorization: `Bearer ${tok.access_token}` };
const since = new Date(Date.now() - 7 * 86400000).toISOString();
const queries = ['china travel', 'china shorts', 'visit china', 'chinese city', 'china food street', 'china surprised'];
const found = {};
for (const q of queries) {
  const r = await (await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&order=viewCount&publishedAfter=${since}&maxResults=10&q=${encodeURIComponent(q)}&relevanceLanguage=en`, { headers: H })).json();
  for (const it of r.items || []) found[it.id.videoId] = { title: it.snippet.title, channel: it.snippet.channelTitle, published: it.snippet.publishedAt.slice(0, 10) };
}
const ids = Object.keys(found);
for (let i = 0; i < ids.length; i += 50) {
  const r = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${ids.slice(i, i + 50).join(',')}`, { headers: H })).json();
  for (const it of r.items || []) Object.assign(found[it.id], { views: +it.statistics.viewCount || 0, likes: +it.statistics.likeCount || 0, dur: it.contentDetails.duration });
}
const top = Object.entries(found).map(([id, v]) => ({ id, ...v })).filter(v => v.views).sort((a, b) => b.views - a.views).slice(0, 25);
const shape = (t) => /\?/.test(t) ? 'question' : /\d/.test(t) ? 'number-claim' : /(only|never|no one|nobody|secret|hidden|can't|cant|wrong)/i.test(t) ? 'paradox-claim' : /#/.test(t) && t.replace(/#\w+/g, '').trim().length < 12 ? 'tag-only-spectacle' : 'other';
const tally = {}; for (const v of top) tally[shape(v.title)] = (tally[shape(v.title)] || 0) + 1;
const lines = [`## ${new Date().toISOString().slice(0, 10)} competitor scan (top 25 China-travel Shorts published in the last 7 days, by views)`,
  `hook-shape tally: ${JSON.stringify(tally)}`,
  ...top.map(v => `- ${v.views}v ${v.likes}L (${(v.likes / v.views * 100).toFixed(1)}%) ${v.dur} | ${v.channel} | ${v.title.slice(0, 80)} | https://youtube.com/shorts/${v.id}`),
  `ACTION for this week's runs: copy the top 3 SHAPES (title grammar, length, spectacle-first) into our Shorts; never copy content.`];
const path = 'automation/youtube/state/competitors.md';
let prev = ''; try { prev = await readFile(path, 'utf8'); } catch {}
await writeFile(path, lines.join('\n') + '\n\n' + prev);
console.log(lines.slice(0, 8).join('\n'));
