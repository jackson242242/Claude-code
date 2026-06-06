#!/usr/bin/env node
/**
 * measure.mjs — turn raw per-post numbers into a 种草 scorecard.
 *
 * 种草 = people want it enough to SAVE and SEND it. So this weights saves + shares
 * highest, then comments, then follow-conversion — not vanity views. Feed it a CSV you
 * fill from each platform's analytics (YouTube Studio / TikTok / 小红书). It computes
 * per-post rates, flags them against starting benchmarks, ranks by a 种草 index, and
 * aggregates per platform so you can see what to kill and what to scale.
 *
 * The benchmarks below are HEURISTIC starting lines — after ~10-20 posts, recalibrate
 * them to YOUR median (the script prints your medians to make that easy). Numbers must be
 * REAL exports; this tool does no magic and invents nothing.
 *
 * CSV columns (header required; missing numeric cells treated as 0):
 *   date,platform,title,length_sec,impressions,views,avg_view_sec,likes,comments,shares,saves,follows
 *
 * Usage:  node scripts/measure.mjs --csv kimetsu/ops/metrics.csv
 */
import { readFileSync, existsSync } from 'node:fs';

const args = parseArgs(process.argv.slice(2));
const csvPath = args.csv || 'kimetsu/ops/metrics.csv';
if (!existsSync(csvPath)) fail(`CSV not found: ${csvPath} (copy the template and fill real numbers).`);

// Starting benchmarks (per-view unless noted). Recalibrate to your own medians over time.
const B = {
  completion: 70,   // avg_view_sec / length_sec, %  (>100 = loops, elite)
  engRate: 8,       // (likes+comments+shares+saves) / views, %
  saveRate: 2,      // saves / views, %   ← core 种草 signal
  shareRate: 1,     // shares / views, %  ← core 种草 signal (reach multiplier)
  followPerK: 5,    // follows per 1000 views
};

const rows = parseCsv(readFileSync(csvPath, 'utf8'));
if (rows.length === 0) fail('No data rows. Fill the CSV with at least one posted video.');

const scored = rows.map((r) => {
  const views = num(r.views) || num(r.impressions) || 0;
  const m = {
    ...r,
    viewsBase: views,
    completion: pct(num(r.avg_view_sec), num(r.length_sec)),
    engRate: pct(num(r.likes) + num(r.comments) + num(r.shares) + num(r.saves), views),
    saveRate: pct(num(r.saves), views),
    shareRate: pct(num(r.shares), views),
    commentRate: pct(num(r.comments), views),
    followPerK: views ? round1((num(r.follows) / views) * 1000) : 0,
  };
  // 种草 index: saves + shares dominate (keep + spread), comments add, follows convert.
  m.zhongcao = round1(m.saveRate * 4 + m.shareRate * 4 + m.commentRate * 1.5 + m.followPerK * 0.6);
  return m;
});

// ---- per-post scorecard -----------------------------------------------------
console.log('\n📊 种草 SCORECARD (per post)\n');
const flag = (v, b) => (v >= b ? '✅' : v >= b * 0.6 ? '🟡' : '🔴');
for (const m of [...scored].sort((a, b) => b.zhongcao - a.zhongcao)) {
  console.log(`• ${m.date || '?'} [${m.platform || '?'}] ${trunc(m.title, 32)}`);
  console.log(
    `   种草指数 ${String(m.zhongcao).padStart(5)} | ` +
      `完播 ${flag(m.completion, B.completion)}${m.completion}% | ` +
      `互动 ${flag(m.engRate, B.engRate)}${m.engRate}% | ` +
      `收藏 ${flag(m.saveRate, B.saveRate)}${m.saveRate}% | ` +
      `转发 ${flag(m.shareRate, B.shareRate)}${m.shareRate}% | ` +
      `涨粉/千 ${flag(m.followPerK, B.followPerK)}${m.followPerK}`,
  );
}

// ---- per-platform aggregate -------------------------------------------------
console.log('\n📈 BY PLATFORM (median)\n');
const byPlat = groupBy(scored, (r) => r.platform || '?');
for (const [plat, list] of Object.entries(byPlat)) {
  console.log(
    `${plat.padEnd(10)} n=${list.length}  ` +
      `完播 ${med(list, 'completion')}%  互动 ${med(list, 'engRate')}%  ` +
      `收藏 ${med(list, 'saveRate')}%  转发 ${med(list, 'shareRate')}%  涨粉/千 ${med(list, 'followPerK')}  ` +
      `种草 ${med(list, 'zhongcao')}`,
  );
}

// ---- verdict + recalibration hint ------------------------------------------
const best = [...scored].sort((a, b) => b.zhongcao - a.zhongcao)[0];
const worst = [...scored].sort((a, b) => a.zhongcao - b.zhongcao)[0];
console.log('\n🧭 READ-OUT');
console.log(`   Scale this: "${trunc(best.title, 40)}" (种草 ${best.zhongcao}) — make 2-3 variants of its hook/theme.`);
if (scored.length > 1) console.log(`   Kill/rework: "${trunc(worst.title, 40)}" (种草 ${worst.zhongcao}).`);
console.log(`   Your medians → completion ${med(scored, 'completion')}%, save ${med(scored, 'saveRate')}%, share ${med(scored, 'shareRate')}%.`);
console.log('   After ~10-20 posts, set the benchmarks in this script to your medians, then chase the top quartile.\n');
console.log('Note: real exported numbers only. Benchmarks are heuristics, not guarantees.\n');

// --- helpers ---
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  const header = lines.shift().split(',').map((h) => h.trim());
  return lines.map((l) => {
    const cells = l.split(',');
    const o = {};
    header.forEach((h, i) => (o[h] = (cells[i] ?? '').trim()));
    return o;
  });
}
function num(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
function pct(a, b) { return b ? round1((a / b) * 100) : 0; }
function round1(n) { return Math.round(n * 10) / 10; }
function trunc(s, n) { s = s || ''; return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function groupBy(arr, fn) { return arr.reduce((m, x) => ((m[fn(x)] ||= []).push(x), m), {}); }
function med(list, key) {
  const v = list.map((x) => x[key]).sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return round1(v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2);
}
function parseArgs(argv) { const o = {}; for (let i = 0; i < argv.length; i += 1) if (argv[i].startsWith('--')) { o[argv[i].slice(2)] = argv[i + 1]; i += 1; } return o; }
function fail(m) { console.error(m); process.exit(1); }
