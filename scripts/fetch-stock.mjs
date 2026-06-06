#!/usr/bin/env node
/**
 * fetch-stock.mjs — download royalty-free / commercially-usable b-roll from Pexels,
 * so cuts are built from LEGAL footage instead of copyrighted clips scraped off the web.
 *
 * Pexels license: free to use, modify, no attribution required (attribution appreciated);
 * we still log the source URL + author for your records. https://www.pexels.com/license/
 *
 * Prerequisites (owner-granted; fails clearly without them — never paste secrets in chat):
 *   1. PEXELS_API_KEY in the environment (free key from pexels.com/api).
 *   2. Network allowlist: api.pexels.com + the Pexels CDN hosts
 *      (videos.pexels.com / *.pexels.com / images.pexels.com).
 *
 * Usage (single):
 *   node scripts/fetch-stock.mjs --query "falling snow night" --type video \
 *     --out kimetsu/assets/2026-06-06/s1.mp4 [--orientation portrait]
 * Usage (batch): JSON array of { name, query, type }:
 *   node scripts/fetch-stock.mjs --queries kimetsu/briefs/stock-2026-06-06.json \
 *     --outdir kimetsu/assets/2026-06-06
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const key = process.env.PEXELS_API_KEY;
if (!key) {
  fail(
    'Missing PEXELS_API_KEY.\nGet a free key at https://www.pexels.com/api/, add it as an ' +
      'environment secret (Variables) — never paste in chat — and allowlist api.pexels.com + ' +
      'the Pexels CDN hosts. See kimetsu/SETUP.md §C.',
  );
}

const orientation = args.orientation || 'portrait';
let jobs;
if (args.queries) {
  const list = JSON.parse(readFileSync(args.queries, 'utf8'));
  if (!Array.isArray(list)) fail('--queries file must be a JSON array of { name, query, type }.');
  const outdir = args.outdir || dirname(args.queries);
  jobs = list.map((it) => ({
    query: it.query,
    type: it.type || 'video',
    out: join(outdir, `${it.name}.${(it.type || 'video') === 'video' ? 'mp4' : 'jpg'}`),
  }));
} else if (args.query && args.out) {
  jobs = [{ query: args.query, type: args.type || 'video', out: args.out }];
} else {
  fail('Usage: --query "..." --type video|photo --out file  OR  --queries list.json [--outdir dir]');
}

for (const job of jobs) {
  const url =
    job.type === 'photo'
      ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(job.query)}&orientation=${orientation}&per_page=1`
      : `https://api.pexels.com/videos/search?query=${encodeURIComponent(job.query)}&orientation=${orientation}&per_page=1`;
  const res = await fetch(url, { headers: { Authorization: key } }).catch((e) =>
    fail(`Network error reaching api.pexels.com: ${e.message}\nIs api.pexels.com on the allowlist?`),
  );
  if (!res.ok) fail(`Pexels API error ${res.status}: ${await res.text()}`);
  const data = await res.json();

  let mediaUrl, credit;
  if (job.type === 'photo') {
    const p = data.photos?.[0];
    if (!p) fail(`No photo result for "${job.query}".`);
    mediaUrl = p.src?.large2x || p.src?.original;
    credit = `${p.photographer} — ${p.url}`;
  } else {
    const v = data.videos?.[0];
    if (!v) fail(`No video result for "${job.query}".`);
    // prefer a portrait HD file; fall back to the largest available
    const files = (v.video_files || []).sort((a, b) => (b.height || 0) - (a.height || 0));
    const portrait = files.find((f) => (f.height || 0) >= (f.width || 0));
    mediaUrl = (portrait || files[0])?.link;
    credit = `${v.user?.name} — ${v.url}`;
  }
  if (!mediaUrl) fail(`No usable media file for "${job.query}".`);

  const bin = await fetch(mediaUrl).catch((e) => fail(`Download failed: ${e.message}\nIs the Pexels CDN host on the allowlist?`));
  if (!bin.ok) fail(`Download error ${bin.status} for ${mediaUrl}`);
  await mkdir(dirname(job.out), { recursive: true });
  await writeFile(job.out, Buffer.from(await bin.arrayBuffer()));
  console.log(`✓ ${job.out}  ← Pexels (${credit})`);
}
console.log(`Done: ${jobs.length} asset(s). License: Pexels (free, commercial-OK). Reference them in the manifest.`);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i += 1; }
  }
  return out;
}
function fail(msg) { console.error(msg); process.exit(1); }
