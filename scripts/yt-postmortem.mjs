#!/usr/bin/env node
/**
 * Daily post-mortem (owner 2026-09-02: "每天有没有分析为什么做得比别人差").
 * Pulls stats for videos published in the last 3 days, compares each to the
 * trailing-14-day median at similar age, classifies winners/losers, and writes
 * a 3-line verdict per video to automation/youtube/state/postmortem.md.
 * The daily run MUST read the verdict before picking today's topics.
 *
 * 2026-10-17 (contract C6):
 *   - Every run appends view snapshots {videoId, publishAt, ageHours, views, likes, comments, at}
 *     to automation/youtube/state/view-snapshots.json for every video published in the last
 *     --snapshot-days (default 60). Same videos.list call as the stats: 1 unit per 50 ids.
 *     ageHours is measured from publishAt (published.json; falls back to <date>T12:00Z).
 *   - EQUAL-AGE section: views at 48 h and 72 h (±6 h) from those snapshots. The routine runs
 *     once a day, so slots c/d are rarely snapshotted inside ±6 h; their value is then
 *     interpolated linearly between the two snapshots either side (≤36 h apart), marked "~".
 *   - Tries the YouTube Analytics API (per-video views, averageViewPercentage, averageViewDuration,
 *     subscribersGained, likes; Shorts-feed traffic per fresh video; daily Shorts-feed views)
 *     and degrades to one line on 403 (API not enabled / token without the scope).
 *   - The snapshot, equal-age and Analytics sections are each guarded: an error there becomes
 *     one "unavailable: ..." line and the main verdict is still written (routine step 1 needs it).
 *
 * Usage: NODE_USE_ENV_PROXY=1 node scripts/yt-postmortem.mjs
 *          [--out <md>] [--snapshots <json>] [--snapshot-days 60]
 *   --out        report file the verdict is prepended to (default automation/youtube/state/postmortem.md)
 *   --snapshots  snapshot store (default automation/youtube/state/view-snapshots.json)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
const args = parseArgs(process.argv.slice(2));
const OUT = args.out || 'automation/youtube/state/postmortem.md';
const SNAP_PATH = args.snapshots || 'automation/youtube/state/view-snapshots.json';
const SNAP_DAYS = Number(args['snapshot-days'] ?? 60);
const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) { console.error('missing YOUTUBE_* env'); process.exit(1); }
const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }) })).json();
if (!tok.access_token) { console.error('token refresh failed', tok.error || '', tok.error_description || ''); process.exit(1); }
const auth = { Authorization: `Bearer ${tok.access_token}` };
const pub = JSON.parse(await readFile('automation/youtube/state/published.json', 'utf8')).videos.filter(v => v.videoId && v.date);
const today = new Date(); const day = (d) => Math.round((today - new Date(d + 'T12:00:00Z')) / 86400000);
const recent = pub.filter(v => day(v.date) <= 16 && day(v.date) >= 0);
const tracked = pub.filter(v => day(v.date) <= Math.max(16, SNAP_DAYS) && day(v.date) >= 0); // superset of recent
const ids = [...new Set(tracked.map(v => v.videoId))];
const stats = {};
let listCalls = 0;
for (let i = 0; i < ids.length; i += 50) {
  const r = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${ids.slice(i, i + 50).join(',')}`,
    { headers: auth })).json();
  listCalls++;
  if (r.error) console.error(`videos.list error ${r.error.code}: ${r.error.message}`);
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

// ---------------------------------------------------------------- view snapshots (C6)
const pubAtOf = (v) => v.publishAt || `${v.date}T12:00:00Z`;
let store = null;
let added = 0;
try {
  store = await loadSnapshots(SNAP_PATH);
  if (store) {
    const lastAt = new Map();
    for (const s of store.snapshots) if (!lastAt.has(s.videoId) || s.at > lastAt.get(s.videoId)) lastAt.set(s.videoId, s.at);
    const at = today.toISOString();
    const seen = new Set();
    for (const v of tracked) {
      const s = stats[v.videoId];
      if (!s || seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      const publishAt = pubAtOf(v);
      const ageHours = Math.round(((today - new Date(publishAt)) / 3.6e6) * 10) / 10;
      if (!(ageHours >= 0) || ageHours > SNAP_DAYS * 24) continue; // not yet public, bad date, or too old
      const prev = lastAt.get(v.videoId);
      if (prev && today - new Date(prev) < 3600e3) continue; // already snapshotted within the hour
      store.snapshots.push({ videoId: v.videoId, publishAt, ageHours, views: s.v, likes: s.l, comments: s.c, at });
      added++;
    }
    await saveSnapshots(SNAP_PATH, store);
  }
} catch (e) {
  console.error(`[postmortem] snapshot store failed: ${e.message}`);
  lines.push(`- view snapshots: unavailable: ${e.message}`);
  store = null;
  added = 0; // nothing was saved
}

// ---------------------------------------------------------------- equal-age section (C6)
try {
  if (store && store.snapshots.length) {
    const byVid = new Map();
    for (const s of store.snapshots) (byVid.get(s.videoId) || byVid.set(s.videoId, []).get(s.videoId)).push(s);
    for (const list of byVid.values()) list.sort((a, b) => a.ageHours - b.ageHours);
    const since = store.snapshots.reduce((m, s) => (s.at < m ? s.at : m), store.snapshots[0].at).slice(0, 10);
    const eqSeen = new Set(); // a videoId listed twice in published.json is shown once
    const eq = pub.filter(v => day(v.date) >= 0 && day(v.date) <= 28 && byVid.has(v.videoId) && !eqSeen.has(v.videoId) && eqSeen.add(v.videoId))
      .map(v => ({ v, h48: atAge(byVid.get(v.videoId), 48), h72: atAge(byVid.get(v.videoId), 72) }))
      .filter(r => r.h48 || r.h72)
      .sort((a, b) => pubAtOf(b.v).localeCompare(pubAtOf(a.v)));
    if (!eq.length) {
      lines.push(`### Equal age (48 h / 72 h): no values yet — ${store.snapshots.length} snapshots since ${since}; a video gets a value once it has been snapshotted within ±6 h of that age or on both sides of it.`);
    } else {
      const shorts = eq.filter(r => r.v.slot !== 'L');
      const med = (k) => { const a = shorts.filter(r => r[k]).map(r => r[k].views); return a.length ? `${median(a)}v (n=${a.length})` : 'n/a'; };
      lines.push(`### Equal age (Data API snapshots since ${since}; 48 h / 72 h ±6 h; "~" = interpolated between the snapshots either side)`);
      lines.push(`- Shorts median, trailing 28 d: 48h ${med('h48')} · 72h ${med('h72')}`);
      const fmtAge = (x) => (x ? `${x.interp ? '~' : ''}${x.views}v ${x.likes}L ${x.comments}C` : '—');
      // older entries keep the aspect ratio ("9x16"/"16x9") in `format`: only F1-F4/L are format codes
      const fmtCode = (f) => (/^(F[1-4]|L)$/.test(f || '') ? f : '-');
      for (const r of eq.slice(0, 15)) {
        lines.push(`- ${r.v.date} ${r.v.slot} fmt:${fmtCode(r.v.format)} ${r.v.videoId} | 48h ${fmtAge(r.h48)} | 72h ${fmtAge(r.h72)} | ${(r.v.title || '').slice(0, 60)}`);
      }
    }
  }
} catch (e) {
  console.error(`[postmortem] equal-age section failed: ${e.message}`);
  lines.push(`### Equal age (48 h / 72 h)`, `- unavailable: ${e.message}`);
}

// ---------------------------------------------------------------- YouTube Analytics API (C6)
try {
  lines.push(...await analyticsSection());
} catch (e) {
  console.error(`[postmortem] Analytics section failed: ${e.message}`);
  lines.push('### YouTube Analytics API', `- unavailable: ${e.message}`);
}

const path = OUT;
let prev = ''; try { prev = await readFile(path, 'utf8'); } catch {}
await mkdir(dirname(path), { recursive: true });
await writeFile(path, lines.join('\n') + '\n\n' + prev);
console.log(lines.join('\n'));
console.error(`[postmortem] videos.list calls: ${listCalls} (${listCalls} quota units); snapshots added: ${added}${store ? ` -> ${SNAP_PATH}` : ' (snapshot store unavailable; not written)'}; report -> ${path}`);

// ---------------------------------------------------------------- helpers
function atAge(list, target, tol = 6) {
  let best = null;
  for (const s of list) if (Math.abs(s.ageHours - target) <= tol && (!best || Math.abs(s.ageHours - target) < Math.abs(best.ageHours - target))) best = s;
  if (best) return { views: best.views, likes: best.likes, comments: best.comments, interp: false };
  const lo = [...list].reverse().find(s => s.ageHours < target);
  const hi = list.find(s => s.ageHours > target);
  if (!lo || !hi || hi.ageHours - lo.ageHours > 36) return null;
  const f = (target - lo.ageHours) / (hi.ageHours - lo.ageHours);
  const lerp = (k) => Math.round(lo[k] + f * (hi[k] - lo[k]));
  return { views: lerp('views'), likes: lerp('likes'), comments: lerp('comments'), interp: true };
}

async function loadSnapshots(p) {
  const empty = { note: 'Per-run view snapshots written by scripts/yt-postmortem.mjs (ageHours from publishAt). Append-only.', snapshots: [] };
  let text;
  try { text = await readFile(p, 'utf8'); } catch { return empty; }
  try {
    const j = JSON.parse(text);
    if (Array.isArray(j)) return { ...empty, snapshots: j };
    if (Array.isArray(j.snapshots)) return { note: j.note || empty.note, snapshots: j.snapshots };
  } catch {}
  console.error(`[postmortem] ${p} is not valid snapshot JSON; leaving it untouched and skipping snapshots this run.`);
  return null;
}

async function saveSnapshots(p, s) {
  await mkdir(dirname(p), { recursive: true });
  // one snapshot per line keeps the daily git diff readable
  await writeFile(p, `{"note": ${JSON.stringify(s.note)},\n "snapshots": [\n${s.snapshots.map(x => JSON.stringify(x)).join(',\n')}\n]}\n`);
}

async function analytics(params) {
  const url = `https://youtubeanalytics.googleapis.com/v2/reports?${new URLSearchParams({ ids: 'channel==MINE', ...params })}`;
  let res;
  // 30 s cap so a hanging Analytics call cannot stall the daily routine
  try { res = await fetch(url, { headers: auth, signal: AbortSignal.timeout(30000) }); } catch (e) { return { ok: false, status: 0, reason: e.name === 'TimeoutError' ? 'timeout' : 'network', message: e.message }; }
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true, data };
  const e = data.error || {};
  const reason = e.errors?.[0]?.reason || e.details?.find?.(d => d.reason)?.reason || e.status || '';
  return { ok: false, status: res.status, reason, message: e.message || '' };
}

function analyticsProblem(r) {
  if (/accessNotConfigured|SERVICE_DISABLED/.test(r.reason) || /has not been used|is disabled/.test(r.message)) {
    return `unavailable: HTTP ${r.status} ${r.reason || 'accessNotConfigured'} — the YouTube Analytics API is not enabled in the Google Cloud project (owner action: APIs & Services > enable "YouTube Analytics API"; checklist in scripts/youtube-oauth-helper.mjs). Equal-age numbers come from Data API snapshots only.`;
  }
  if (/insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT|forbidden/i.test(r.reason) || r.status === 401) {
    return `unavailable: HTTP ${r.status} ${r.reason} — the refresh token lacks an Analytics scope (re-mint with scripts/youtube-oauth-helper.mjs --scopes youtube,youtube.upload,youtube.force-ssl,yt-analytics.readonly).`;
  }
  return `unavailable: HTTP ${r.status} ${r.reason} ${String(r.message).slice(0, 160)}`.trim();
}

async function analyticsSection() {
  const out = ['### YouTube Analytics API'];
  const ymd = (d) => d.toISOString().slice(0, 10);
  const endDate = ymd(today);
  const vids = recent.filter(v => stats[v.videoId]);
  if (!vids.length) return [...out, '- skipped: no recent videos'];
  const startDate = vids.reduce((m, v) => (v.date < m ? v.date : m), vids[0].date);
  const per = await analytics({ startDate, endDate, dimensions: 'video', filters: `video==${vids.map(v => v.videoId).join(',')}`,
    metrics: 'views,averageViewPercentage,averageViewDuration,subscribersGained,likes', sort: '-views', maxResults: 200 });
  if (!per.ok) return [...out, `- ${analyticsProblem(per)}`];
  const cols = (per.data.columnHeaders || []).map(c => c.name);
  const m = new Map((per.data.rows || []).map(row => [row[0], Object.fromEntries(cols.map((c, i) => [c, row[i]]))]));
  out.push(`- per video, ${startDate}..${endDate} (Analytics lags ~1-2 days behind the Data API counts):`);
  const freshVids = vids.filter(v => day(v.date) <= 3);
  const shortsFeed = new Map();
  for (const v of freshVids) {
    const t = await analytics({ startDate: v.date, endDate, dimensions: 'insightTrafficSourceType', filters: `video==${v.videoId}`, metrics: 'views' });
    if (!t.ok) { out.push(`- traffic sources for ${v.videoId}: ${analyticsProblem(t)}`); break; }
    const total = (t.data.rows || []).reduce((a, r) => a + (+r[1] || 0), 0);
    const sh = (t.data.rows || []).find(r => r[0] === 'SHORTS');
    shortsFeed.set(v.videoId, { shorts: sh ? +sh[1] : 0, total });
  }
  for (const v of [...vids].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15)) {
    const r = m.get(v.videoId);
    const sf = shortsFeed.get(v.videoId);
    const sfTxt = sf ? ` | Shorts feed ${sf.shorts}v of ${sf.total}v${sf.total ? ` (${Math.round((sf.shorts / sf.total) * 100)}%)` : ''}` : '';
    out.push(r
      ? `  - ${v.date} ${v.slot} ${v.videoId} | ${r.views}v avg ${(+r.averageViewPercentage).toFixed(1)}% (${Math.round(r.averageViewDuration)}s) +${r.subscribersGained} subs ${r.likes}L${sfTxt}`
      : `  - ${v.date} ${v.slot} ${v.videoId} | no Analytics rows yet${sfTxt}`);
  }
  const daily = await analytics({ startDate: ymd(new Date(today - 14 * 86400000)), endDate, dimensions: 'day,insightTrafficSourceType', metrics: 'views', sort: 'day' });
  if (daily.ok) {
    const byDay = (daily.data.rows || []).filter(r => r[1] === 'SHORTS').map(r => `${r[0].slice(5)} ${r[2]}`);
    out.push(`- Shorts-feed views by day (channel): ${byDay.join(' · ') || 'no rows'}`);
  } else out.push(`- Shorts-feed views by day: ${analyticsProblem(daily)}`);
  return out;
}

/** --key value | --key=value | --flag. */
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const eq = argv[i].indexOf('=');
    if (eq > 2) { o[argv[i].slice(2, eq)] = argv[i].slice(eq + 1); continue; }
    o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  }
  return o;
}
