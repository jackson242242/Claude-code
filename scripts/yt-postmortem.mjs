#!/usr/bin/env node
/**
 * Daily post-mortem (owner 2026-09-02: "每天有没有分析为什么做得比别人差").
 * Pulls stats for videos published in the last 3 days, compares each to the
 * trailing-14-day median at similar age, classifies winners/losers, and writes
 * a 3-line verdict per video to automation/youtube/state/postmortem.md.
 * The daily run MUST read the verdict before picking today's topics.
 *
 * Usage: NODE_USE_ENV_PROXY=1 node scripts/yt-postmortem.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) { console.error('missing YOUTUBE_* env'); process.exit(1); }
const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }) })).json();
if (!tok.access_token) { console.error('token refresh failed', tok); process.exit(1); }
const pub = JSON.parse(await readFile('automation/youtube/state/published.json', 'utf8')).videos.filter(v => v.videoId && v.date);
const today = new Date(); const day = (d) => Math.round((today - new Date(d + 'T12:00:00Z')) / 86400000);
const recent = pub.filter(v => day(v.date) <= 16 && day(v.date) >= 0);
const ids = recent.map(v => v.videoId);
const stats = {};
for (let i = 0; i < ids.length; i += 50) {
  const r = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${ids.slice(i, i + 50).join(',')}`,
    { headers: { Authorization: `Bearer ${tok.access_token}` } })).json();
  for (const it of r.items || []) stats[it.id] = { v: +it.statistics.viewCount || 0, l: +it.statistics.likeCount || 0, c: +it.statistics.commentCount || 0, dur: it.contentDetails.duration };
}
const rows = recent.map(v => ({ ...v, ...(stats[v.videoId] || { v: 0, l: 0, c: 0 }), age: day(v.date) }));
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const baseline = median(rows.filter(r => r.age >= 3 && r.slot !== 'L').map(r => r.v));
const fresh = rows.filter(r => r.age <= 2);
const lines = [`## ${today.toISOString().slice(0, 10)} post-mortem (baseline = 14d median views of Shorts ≥3d old: ${baseline})`];
for (const r of fresh.sort((a, b) => b.v - a.v)) {
  const ratio = baseline ? (r.v / baseline).toFixed(2) : 'n/a';
  const verdict = r.slot === 'L' ? (r.v < 20 ? 'LONGFORM: no distribution (expected on this channel; search-ranking is slow)' : 'LONGFORM: has traffic')
    : r.v >= baseline * 2 ? 'WINNER — replicate this hook shape today' : r.v <= baseline * 0.5 ? 'LOSER — avoid this shape today' : 'baseline';
  lines.push(`- ${r.date} ${r.slot} ${r.videoId} | ${r.v}v ${r.l}L ${r.c}C @${r.age}d | ×${ratio} | ${verdict} | ${(r.title || '').slice(0, 70)}`);
}
lines.push(`- like-rate (fresh Shorts): ${(fresh.filter(r=>r.slot!=='L').reduce((a,r)=>a+r.l,0)/Math.max(1,fresh.filter(r=>r.slot!=='L').reduce((a,r)=>a+r.v,0))*100).toFixed(2)}% (peers 1-6%)`);
const path = 'automation/youtube/state/postmortem.md';
let prev = ''; try { prev = await readFile(path, 'utf8'); } catch {}
await writeFile(path, lines.join('\n') + '\n\n' + prev);
console.log(lines.join('\n'));
