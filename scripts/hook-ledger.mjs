#!/usr/bin/env node
/**
 * Hook learning loop (owner 2026-09-20: 每条用 discussion-worthy hook → 发完分析 →
 * 沉淀 MD → 下一条先学 MD).
 *
 * Reads every Short published in the window, recovers its actual hook (cue 1 of
 * runs/<date>-<slot>/subs.srt, falling back to the title), classifies the hook
 * into a discussion taxonomy, pulls live stats, and REWRITES the measured
 * sections of automation/youtube/HOOKS.md: a leaderboard of hook types by real
 * performance, the per-video ledger, and which types to use/avoid next.
 *
 * Usage: NODE_USE_ENV_PROXY=1 node scripts/hook-ledger.mjs [--days 30]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const HOOKS = 'automation/youtube/HOOKS.md';
const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) { console.error('missing YOUTUBE_* env'); process.exit(1); }
const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[i + 1];
const DAYS = Number(args.days || 30);

// Discussion taxonomy — a hook only counts as discussion-worthy if a viewer can
// DISAGREE, CHOOSE, or BE SURPRISED enough to type. Pure facts cannot.
const TYPES = [
  ['DEBATE', /\b(overrated|underrated|not worth|skip|worst|best|nobody should|stop )\b/i, 'opinion that splits the room'],
  ['MISCONCEPTION', /\b(everyone thinks|most people|you think|actually|myth|wrong about|isn'?t what)\b/i, 'corrects a belief they hold'],
  ['CHOICE', /\b(or)\b.*\?|\bwhich\b.*\?|\bwould you\b/i, 'forces them to pick a side'],
  ['PRICE-SHOCK', /[$¥€£]\s?\d|\b\d+\s?(times|x)\s?(cheaper|more)\b|\bcosts? (only|just)\b/i, 'price gap they want to dispute'],
  ['STAKES', /\b(mistake|denied|voids?|banned|fined|refused|don'?t|never|avoid)\b/i, 'personal consequence'],
  ['INSIDER', /\b(locals?|nobody|no one|secret|hidden|tourists? (never|don'?t))\b/i, 'in-group knowledge'],
  ['SPECTACLE-FACT', /\b\d/, 'a number, but no angle to argue with'],
];
const classify = (s) => (TYPES.find(([, re]) => re.test(s)) || ['PLAIN-FACT', null, 'nothing to reply to'])[0];

const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }) })).json();
if (!tok.access_token) { console.error('token refresh failed'); process.exit(1); }

const pub = JSON.parse(await readFile('automation/youtube/state/published.json', 'utf8')).videos
  .filter((v) => v.videoId && v.date && v.slot !== 'L');
const today = new Date();
const age = (d) => Math.round((today - new Date(d + 'T12:00:00Z')) / 86400000);
const rows = pub.filter((v) => age(v.date) <= DAYS && age(v.date) >= 1);

const stats = {};
const ids = rows.map((v) => v.videoId);
for (let i = 0; i < ids.length; i += 50) {
  const r = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.slice(i, i + 50).join(',')}`,
    { headers: { Authorization: `Bearer ${tok.access_token}` } })).json();
  for (const it of r.items || []) stats[it.id] = { v: +it.statistics.viewCount || 0, l: +it.statistics.likeCount || 0, c: +it.statistics.commentCount || 0 };
}

const entries = [];
for (const v of rows) {
  const srt = `automation/youtube/runs/${v.date}-${v.slot}/subs.srt`;
  let hook = '';
  if (existsSync(srt)) {
    const blocks = (await readFile(srt, 'utf8')).split(/\n\s*\n/).filter(Boolean);
    hook = (blocks[0] || '').split('\n').slice(2).join(' ').trim();
  }
  if (!hook) hook = (v.title || '').split('|')[0].trim();
  const s = stats[v.videoId] || { v: 0, l: 0, c: 0 };
  entries.push({ ...v, hook, type: classify(hook), ...s, age: age(v.date) });
}
const mature = entries.filter((e) => e.age >= 3);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const base = med(mature.map((e) => e.v)) || 1;

const byType = {};
for (const e of mature) {
  (byType[e.type] ||= { n: 0, v: 0, l: 0, c: 0 });
  byType[e.type].n++; byType[e.type].v += e.v; byType[e.type].l += e.l; byType[e.type].c += e.c;
}
const board = Object.entries(byType).map(([t, d]) => ({
  type: t, n: d.n, avg: Math.round(d.v / d.n), idx: +(d.v / d.n / base).toFixed(2),
  likeRate: +(d.l / Math.max(1, d.v) * 100).toFixed(2), comments: d.c,
})).sort((a, b) => b.idx - a.idx);

const stamp = today.toISOString().slice(0, 10);
const measured = [
  `<!-- AUTO:BEGIN — rewritten by scripts/hook-ledger.mjs, do not hand-edit below -->`,
  `## 📊 实测排行（${stamp}，近 ${DAYS} 天、满 3 天的 ${mature.length} 条；baseline 中位数 ${base} 播放）`,
  '',
  '| 钩子类型 | 条数 | 均播放 | 相对基准 | 点赞率 | 评论 |',
  '|---|---|---|---|---|---|',
  ...board.map((b) => `| ${b.type} | ${b.n} | ${b.avg} | ×${b.idx} | ${b.likeRate}% | ${b.comments} |`),
  '',
  `**下一条用**：${board.filter((b) => b.idx >= 1 && b.n >= 2).map((b) => b.type).join(' / ') || '样本不足，优先 DEBATE / CHOICE / MISCONCEPTION（讨论性最高）'}`,
  `**避免**：${board.filter((b) => b.idx < 0.8 && b.n >= 2).map((b) => b.type).join(' / ') || 'PLAIN-FACT（无可回复点）'}`,
  '',
  `## 📒 近期逐条账本（新→旧）`,
  '',
  '| 日期 | 播放 | ×基准 | 赞 | 评 | 类型 | 钩子原文 |',
  '|---|---|---|---|---|---|---|',
  ...entries.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40)
    .map((e) => `| ${e.date}${e.slot} | ${e.v} | ×${(e.v / base).toFixed(2)} | ${e.l} | ${e.c} | ${e.type} | ${e.hook.replace(/\|/g, '/').slice(0, 64)} |`),
  `<!-- AUTO:END -->`,
].join('\n');

let doc = existsSync(HOOKS) ? await readFile(HOOKS, 'utf8') : '';
doc = doc.includes('<!-- AUTO:BEGIN')
  ? doc.replace(/<!-- AUTO:BEGIN[\s\S]*<!-- AUTO:END -->/, measured)
  : `${doc}\n\n${measured}\n`;
await writeFile(HOOKS, doc);
console.log(board.map((b) => `${b.type} n=${b.n} ×${b.idx} like ${b.likeRate}% c=${b.comments}`).join('\n'));
console.log(`\nHOOKS.md updated (${entries.length} entries, baseline ${base}).`);
