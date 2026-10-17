#!/usr/bin/env node
/**
 * Backfill status.containsSyntheticMedia=true on already-published videos (contract C4).
 *
 * Why: YouTube requires the "altered or synthetic content" disclosure for synthetically
 * generated music, and every bed this channel has used so far is AI-generated (decision D1,
 * 2026-10-17). New uploads get the flag from scripts/youtube-upload.mjs; this script fixes
 * the back catalogue. OWNER DECIDES WHETHER TO RUN IT (D4) — it is not part of the routine,
 * and no agent runs it live without the owner's explicit go-ahead.
 *
 * Usage:
 *   NODE_USE_ENV_PROXY=1 node scripts/apply-synthetic-flag.mjs --dry-run [--limit N]
 *   NODE_USE_ENV_PROXY=1 node scripts/apply-synthetic-flag.mjs --apply [--limit N]   (owner only)
 *     [--queue <json>] [--published <json>] [--music-manifest <json>]
 *
 *   --dry-run     no videos.update calls and no file writes: lists the next N videos and,
 *                 when YouTube credentials are present, reads their current status
 *                 (videos.list, 1 unit per 50 ids) and prints the exact update body.
 *   --apply       REQUIRED for anything that writes (the queue file or videos.update).
 *                 Without --apply or --dry-run the script refuses and changes nothing.
 *   --limit N     videos to process this run (default 40; 0 = only build the queue file).
 *   --queue       queue file (default automation/youtube/state/synthetic-flag-queue.json).
 *   --published   published log to build the queue from on first run
 *                 (default automation/youtube/state/published.json).
 *   Flags may be written --key value or --key=value; an unknown flag stops the script.
 *
 * THE QUEUE FILE IS THE ONLY RECORD OF WHAT WAS UPDATED. videos.list part=status does not
 * return containsSyntheticMedia (checked 2026-10-17 on videos just updated to true; only the
 * videos.update response echoes it), so the "already true" skip below almost never fires.
 * Never delete the queue; commit it. When a queue is (re)built, every videoId marked done in
 * another synthetic-flag-queue*.json (next to the new queue or in the state directory) is
 * carried over as done, so a rebuilt queue does not pay 50 units to update a video twice.
 *
 * Queue: built once from published.json (every entry with a videoId whose music is not
 * known to be human-made only; music that published.json does not record counts as AI —
 * fail-safe, the same rule as the uploader). Items move pending -> done | skipped | error
 * and the file is saved after every update, so the script resumes where it stopped.
 *
 * Per video: videos.list part=status first; already true -> done without an update; else
 * videos.update part=status re-sending privacyStatus, publishAt (still-scheduled videos
 * only), embeddable, license, publicStatsViewable, selfDeclaredMadeForKids together with
 * containsSyntheticMedia=true (an update that omits a status field resets it).
 * A private video whose publishAt is already in the past is skipped, never re-scheduled.
 *
 * Quota: videos.update = 50 units, videos.list = 1 unit per 50 ids (shared with the daily
 * routine: ~5,000 units/day). The default --limit 40 costs about 2,001 units. On
 * quotaExceeded, a 401/403, or 2 consecutive update failures with the same HTTP status and
 * reason, the script saves the queue and stops cleanly; run it again after fixing the cause
 * (quota resets at midnight Pacific time).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decideSynthetic, loadMusicManifest, DEFAULT_MUSIC_MANIFEST } from './youtube-upload.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const KNOWN_FLAGS = ['limit', 'dry-run', 'apply', 'queue', 'published', 'music-manifest'];
const args = parseArgs(process.argv.slice(2));
const unknownFlags = Object.keys(args).filter((k) => !KNOWN_FLAGS.includes(k));
if (unknownFlags.length) fail(`Unknown flag(s): ${unknownFlags.map((k) => `--${k}`).join(' ')}. Known: ${KNOWN_FLAGS.map((k) => `--${k}`).join(' ')}. Nothing done.`);
const dryRun = flag(args['dry-run']);
const apply = flag(args.apply);
if (dryRun && apply) fail('--dry-run and --apply together make no sense; pick one. Nothing done.');
if (!dryRun && !apply) {
  fail('Refusing to run: pass --dry-run to preview, or --apply to write the queue and call videos.update.\n' +
    'Live runs change the AI label on published videos and cost 50 quota units per video from the budget the\n' +
    'daily routine shares; the owner decides whether to run them (decision D4). Nothing done.');
}
const limit = args.limit === undefined ? 40 : Number(args.limit);
if (!Number.isInteger(limit) || limit < 0) fail('--limit must be a whole number >= 0');
const STATE_DIR = `${ROOT}automation/youtube/state`;
const QUEUE = resolve(args.queue || `${STATE_DIR}/synthetic-flag-queue.json`);
const PUBLISHED = args.published || `${STATE_DIR}/published.json`;
const UPDATE_FIELDS = ['privacyStatus', 'embeddable', 'license', 'publicStatsViewable', 'selfDeclaredMadeForKids'];
const MAX_ATTEMPTS = 3;
const MAX_SAME_FAILURES = 2; // consecutive update failures with the same status + reason -> stop

// ---------------------------------------------------------------- queue
let queue;
let created = false;
if (existsSync(QUEUE)) {
  queue = JSON.parse(await readFile(QUEUE, 'utf8'));
  if (!Array.isArray(queue.items)) fail(`${QUEUE} has no "items" array`);
} else {
  queue = await buildQueue();
  created = true;
}
const counts = () => queue.items.reduce((o, it) => ((o[it.state] = (o[it.state] || 0) + 1), o), {});
if (created) {
  if (dryRun) console.log(`Queue ${QUEUE} does not exist; it would be created with ${queue.items.length} videos (not written: --dry-run).`);
  else { await saveQueue(); console.log(`Created ${QUEUE} with ${queue.items.length} videos.`); }
}
const todo = queue.items.filter((it) => it.state === 'pending' || (it.state === 'error' && (it.attempts || 0) < MAX_ATTEMPTS)).slice(0, limit);
console.log(`Queue: ${JSON.stringify(counts())}; this run: ${todo.length} video(s)${dryRun ? ' (dry run)' : ''}.`);
if (!todo.length) process.exit(0);

// ---------------------------------------------------------------- auth
const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) {
  if (!dryRun) fail('Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN.');
  for (const it of todo) console.log(`- would check ${it.videoId} ${it.date} ${it.slot} | ${it.reason} | ${(it.title || '').slice(0, 60)}`);
  console.log('No YouTube credentials: offline dry run (current status not read).');
  process.exit(0);
}
const token = await getAccessToken();

// ---------------------------------------------------------------- run
let listCalls = 0;
let updates = 0;
let stopped = null;
let lastFailKey = null;
let sameFailures = 0;
const current = new Map();
for (let i = 0; i < todo.length && !stopped; i += 50) {
  const ids = todo.slice(i, i + 50).map((it) => it.videoId);
  const r = await api(`https://www.googleapis.com/youtube/v3/videos?part=status&maxResults=50&id=${ids.join(',')}`);
  listCalls++;
  if (!r.ok) { stopped = describe(r); break; }
  for (const v of r.data.items || []) current.set(v.id, v.status || {});
}

const now = new Date();
for (const it of todo) {
  if (stopped) break;
  const st = current.get(it.videoId);
  if (!st) {
    if (dryRun) console.log(`- ${it.videoId}: not returned by videos.list (deleted or not ours); would mark skipped.`);
    else mark(it, 'skipped', { note: 'not returned by videos.list (deleted or not owned)' });
    continue;
  }
  if (st.containsSyntheticMedia === true) {
    if (dryRun) console.log(`- ${it.videoId}: already containsSyntheticMedia=true; would mark done without an update.`);
    else mark(it, 'done', { note: 'already true' });
    continue;
  }
  if (st.privacyStatus === 'private' && st.publishAt && new Date(st.publishAt) <= now) {
    const note = `private with a past publishAt (${st.publishAt}); left alone so the schedule is not changed`;
    if (dryRun) console.log(`- ${it.videoId}: ${note}; would mark skipped.`);
    else mark(it, 'skipped', { note });
    continue;
  }
  const status = {};
  for (const k of UPDATE_FIELDS) if (st[k] !== undefined) status[k] = st[k];
  if (status.selfDeclaredMadeForKids === undefined) status.selfDeclaredMadeForKids = false; // the uploader always declared false
  if (st.privacyStatus === 'private' && st.publishAt) status.publishAt = st.publishAt;
  status.containsSyntheticMedia = true;
  const body = { id: it.videoId, status };
  if (dryRun) {
    console.log(`- ${it.videoId} (${it.date} ${it.slot}, now containsSyntheticMedia=${st.containsSyntheticMedia ?? 'unset'}): would PUT videos?part=status ${JSON.stringify(body)}`);
    continue;
  }
  const r = await api('https://www.googleapis.com/youtube/v3/videos?part=status', { method: 'PUT', body: JSON.stringify(body) });
  if (r.ok) {
    updates++;
    lastFailKey = null;
    sameFailures = 0;
    const echoed = r.data.status?.containsSyntheticMedia;
    mark(it, 'done', { note: echoed === true ? 'updated' : `updated; response containsSyntheticMedia=${echoed ?? 'not echoed'}` });
    console.log(`+ ${it.videoId} updated (containsSyntheticMedia=${echoed ?? 'not echoed'})`);
  } else if (r.quota || r.status === 401 || r.status === 403) {
    updates++;
    stopped = describe(r); // quota, revoked token or missing scope: stop instead of burning quota
    if (!r.quota) mark(it, 'error', { error: stopped });
  } else {
    updates++;
    mark(it, 'error', { error: describe(r) });
    console.log(`! ${it.videoId} failed: ${describe(r)}`);
    const key = `${r.status} ${r.reason || ''}`;
    sameFailures = key === lastFailKey ? sameFailures + 1 : 1;
    lastFailKey = key;
    // A systematic rejection (e.g. a 400 for every video) would burn 50 units per item: stop.
    if (sameFailures >= MAX_SAME_FAILURES) stopped = `${sameFailures} consecutive update failures with the same error (${describe(r)})`;
  }
  await saveQueue();
}
if (!dryRun) await saveQueue();
const units = listCalls + updates * 50;
console.log(`${dryRun ? 'Dry run done' : 'Done'}: ${listCalls} list call(s), ${updates} update call(s), about ${units} quota units. Queue now ${JSON.stringify(counts())}.`);
if (stopped) console.log(`Stopped early: ${stopped}. The queue is saved; run again later to resume.`);

// ---------------------------------------------------------------- helpers
/** videoId -> file name, for every item marked done in another synthetic-flag-queue*.json. */
function doneElsewhere() {
  const done = new Map();
  const dirs = [...new Set([dirname(QUEUE), resolve(STATE_DIR)])];
  for (const dir of dirs) {
    let names = [];
    try { names = readdirSync(dir).filter((n) => /^synthetic-flag-queue.*\.json$/.test(n)); } catch { continue; }
    for (const n of names) {
      const p = join(dir, n);
      if (p === QUEUE) continue;
      try {
        const q = JSON.parse(readFileSync(p, 'utf8'));
        for (const it of q.items || []) if (it && it.state === 'done' && it.videoId && !done.has(it.videoId)) done.set(it.videoId, p.replace(ROOT, ''));
      } catch (e) {
        console.warn(`WARN: could not read earlier queue ${p} (${e.message}); its done items are not carried over.`);
      }
    }
  }
  return done;
}

async function buildQueue() {
  const pub = JSON.parse(await readFile(PUBLISHED, 'utf8'));
  const manifest = loadMusicManifest(args['music-manifest'] || DEFAULT_MUSIC_MANIFEST);
  const earlier = doneElsewhere();
  if (earlier.size) console.log(`Carrying over ${earlier.size} video(s) already done in earlier queue file(s): ${[...new Set(earlier.values())].join(', ')}`);
  const seen = new Set();
  const items = [];
  for (const v of pub.videos || []) {
    if (!v.videoId || seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    // published.json music is free text ("underscore-docu-01+02+03 (concatenated bed)"):
    // keep the hyphenated track-like tokens; nothing recorded -> undeclared (fail-safe AI).
    const tokens = typeof v.music === 'string' ? v.music.match(/[a-z0-9]+(?:-[a-z0-9]+)+/gi) || [] : Array.isArray(v.music) ? v.music : [];
    const d = decideSynthetic({ music: tokens.length ? tokens : undefined, aiFootage: v.aiFootage, containsSyntheticMedia: v.containsSyntheticMedia }, { manifest });
    if (!d.value) continue; // human-made music only and no AI footage: nothing to disclose
    const reason = tokens.length ? d.reasons.join('; ') : 'music not recorded in published.json (fail-safe: every committed bed so far is AI-generated)';
    const item = { videoId: v.videoId, date: v.date, slot: v.slot, title: v.title, music: v.music ?? null, reason, state: 'pending', attempts: 0 };
    if (earlier.has(v.videoId)) Object.assign(item, { state: 'done', note: `done in earlier queue ${earlier.get(v.videoId)}` });
    items.push(item);
  }
  items.sort((a, b) => (b.date || '').localeCompare(a.date || '')); // newest first: they get the most views now
  return {
    note: 'containsSyntheticMedia backfill queue (scripts/apply-synthetic-flag.mjs). Owner decides whether to run it (D4, 2026-10-17). ' +
      'This file is the only record of which videos were updated (videos.list does not return the flag): never delete it.',
    createdAt: new Date().toISOString(),
    source: PUBLISHED.replace(ROOT, ''),
    items,
  };
}

function mark(it, state, extra = {}) {
  it.state = state;
  it.updatedAt = new Date().toISOString();
  if (state === 'error') it.attempts = (it.attempts || 0) + 1;
  Object.assign(it, extra);
  if (state !== 'error') delete it.error;
}

async function saveQueue() {
  await mkdir(dirname(QUEUE), { recursive: true });
  await writeFile(QUEUE, JSON.stringify(queue, null, 1) + '\n');
}

async function api(url, opts = {}) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' } });
    } catch (e) {
      if (attempt <= 3) { await sleep(2 ** attempt * 1000); continue; }
      return { ok: false, status: 0, message: `network error: ${e.message} (set NODE_USE_ENV_PROXY=1 in this container)` };
    }
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
    if (res.ok) return { ok: true, status: res.status, data };
    const reason = data.error?.errors?.[0]?.reason || data.error?.status || '';
    const quota = res.status === 403 && /quotaExceeded|dailyLimitExceeded/.test(reason);
    if ((res.status >= 500 || reason === 'rateLimitExceeded') && attempt <= 3) { await sleep(2 ** attempt * 1000); continue; }
    return { ok: false, status: res.status, reason, quota, message: data.error?.message || data.raw || '' };
  }
}

function describe(r) { return `HTTP ${r.status}${r.reason ? ` ${r.reason}` : ''}${r.message ? `: ${String(r.message).slice(0, 200)}` : ''}`; }

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }),
  }).catch((e) => fail(`token request failed: ${e.message} (set NODE_USE_ENV_PROXY=1 in this container)`));
  const data = await res.json();
  if (!res.ok || !data.access_token) fail(`OAuth token refresh failed ${res.status}: ${data.error || ''} ${data.error_description || ''}`);
  return data.access_token;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
/** --key value | --key=value | --flag. A bare word that is not a flag value is an error. */
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) fail(`Unexpected argument "${argv[i]}". Nothing done.`);
    const eq = argv[i].indexOf('=');
    if (eq > 2) { o[argv[i].slice(2, eq)] = argv[i].slice(eq + 1); continue; }
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    const takesValue = next !== undefined && !next.startsWith('--') && (!['dry-run', 'apply'].includes(key) || /^(true|false|yes|no|on|off|1|0)$/i.test(next));
    o[key] = takesValue ? argv[++i] : 'true';
  }
  return o;
}
function flag(v) { return v !== undefined && !/^(false|0|no|off)$/i.test(String(v)); }
function fail(msg) { console.error(msg); process.exit(1); }
