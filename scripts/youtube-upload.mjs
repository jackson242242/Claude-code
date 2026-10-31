#!/usr/bin/env node
/**
 * Upload a video to the owner's YouTube channel via the YouTube Data API v3.
 *
 * Prerequisites (owner-granted; the script fails clearly without them):
 *   1. Env secrets: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
 *      (mint the refresh token once with scripts/youtube-oauth-helper.mjs on your own
 *      machine — it needs a browser).
 *   2. Hosts `oauth2.googleapis.com` and `www.googleapis.com` on the network allowlist.
 *
 * Usage:
 *   node scripts/youtube-upload.mjs --video final.mp4 --meta meta.json [--thumbnail thumb.png]
 *     [--synthetic] [--dry-run] [--music-manifest <manifest.json>]
 *
 *   --synthetic        force status.containsSyntheticMedia=true.
 *   --dry-run          print the final request body (snippet + status) and the synthetic
 *                      decision, then exit without uploading. Needs no credentials and no
 *                      --video (if --video is given its size is reported).
 *   --music-manifest   music manifest to classify meta.music against (default
 *                      automation/youtube/assets/music/manifest.json); for tests.
 *
 * meta.json shape (all camelCase):
 *   {
 *     "title": "...",                 // <= 100 chars
 *     "description": "...",           // <= 5000 bytes
 *     "tags": ["a", "b"],            // total <= 500 chars
 *     "categoryId": "27",            // 27 = Education
 *     "privacyStatus": "public",     // public | unlisted | private
 *     "publishAt": "2026-07-09T13:00:00Z",  // optional; forces private until then
 *     "defaultLanguage": "en",
 *     "music": "lofi-chill-01.mp3",  // bed file(s) used: string or array; only "none" = no music
 *     "aiFootage": false,            // true = realistic AI-generated/AI-animated footage inside
 *     "containsSyntheticMedia": true // optional explicit disclosure (see below)
 *   }
 *
 * AI / synthetic disclosure (decision D1, 2026-10-17). YouTube requires the "altered or
 * synthetic content" disclosure for realistic AI footage AND for synthetically generated
 * music. status.containsSyntheticMedia is set to true when ANY of:
 *   - meta.containsSyntheticMedia === true, or meta.aiFootage === true, or --synthetic;
 *   - a meta.music track is one of the 9 legacy vidIQ-generated beds (cinema-orient-01,
 *     cpop-groove-01, guzheng-calm-01, lofi-chill-01, lofi-upbeat-01, oriental-edm-01,
 *     underscore-docu-01/02/03);
 *   - a meta.music track has aiGenerated: true in assets/music/manifest.json
 *     (without a manifest entry, el-* ElevenLabs and vq-* vidIQ tracks count as AI);
 *   - meta.music is missing or empty ("" or []), or names a track that is neither a legacy
 *     bed nor flagged in the manifest -- including a yal-* or wc-* file that was never added
 *     to the manifest (warned; fail-safe true).
 * A track counts as human-made only when its manifest entry says aiGenerated: false, and
 * only meta.music "none" means "no music". Otherwise (no AI music, no AI footage) false.
 * Booleans may also be written as strings: "true"/"yes"/"1" and "false"/"no"/"0".
 * Fail closed: meta.aiFootage true together with an explicit meta.containsSyntheticMedia
 * false aborts before anything is uploaded. The decision is printed as
 * `containsSyntheticMedia=<bool> (...)`. The final JSON line carries the requested value
 * (containsSyntheticMedia) and what the API response echoed (containsSyntheticMediaEchoed;
 * null when the response leaves the field out -- then check the label in Studio).
 *
 * Honest notes:
 *   - videos.insert costs ~1600 quota units (default daily quota 10000 -> ~6 uploads/day).
 *   - New/unverified Google Cloud API projects have API uploads LOCKED PRIVATE until the
 *     project passes YouTube's API audit — expect this on a fresh project and either use
 *     scheduled-private uploads + manual flip, or complete the audit form.
 *   - Setting a custom thumbnail requires the channel to be phone-verified; a failure
 *     there is reported as a warning, not a run failure.
 */
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The 9 vidIQ-generated beds committed before 2026-10-17 (all AI-generated music). */
export const LEGACY_AI_BEDS = [
  'cinema-orient-01', 'cpop-groove-01', 'guzheng-calm-01', 'lofi-chill-01', 'lofi-upbeat-01',
  'oriental-edm-01', 'underscore-docu-01', 'underscore-docu-02', 'underscore-docu-03',
];
const AI_PREFIXES = { 'el-': 'ElevenLabs Music track (el-* prefix)', 'vq-': 'vidIQ-generated track (vq-* prefix)' };
const HUMAN_PREFIXES = { 'yal-': 'YouTube Audio Library track (yal-* prefix)', 'wc-': 'Wikimedia Commons track (wc-* prefix)' };
const KNOWN_FLAGS = ['video', 'meta', 'thumbnail', 'synthetic', 'dry-run', 'music-manifest'];
export const DEFAULT_MUSIC_MANIFEST = fileURLToPath(new URL('../automation/youtube/assets/music/manifest.json', import.meta.url));

/**
 * meta.music (string | string[] | undefined) -> track stems, or null when not declared.
 * "" and [] (or only blanks) count as NOT declared: only the word "none" means no music.
 */
export function musicNames(music) {
  if (music === undefined || music === null) return null;
  const list = Array.isArray(music) ? music : String(music).split(/[,+]/);
  const names = list
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .map((s) => basename(s).replace(/\.(mp3|m4a|wav|aac|ogg|flac|opus)$/i, ''))
    .filter(Boolean);
  return names.length ? names : null;
}

/** true / "true" / "yes" / "1" / 1 -> true. */
export function isTrue(v) { return v === true || v === 1 || (typeof v === 'string' && /^(true|yes|1)$/i.test(v.trim())); }
/** false / "false" / "no" / "0" / 0 -> true (an explicit "false"; undefined is not explicit). */
export function isExplicitFalse(v) { return v === false || v === 0 || (typeof v === 'string' && /^(false|no|0)$/i.test(v.trim())); }

/** Read the music manifest into Map(stem -> entry). A missing file gives an empty map. */
export function loadMusicManifest(path = DEFAULT_MUSIC_MANIFEST) {
  const map = new Map();
  if (!existsSync(path)) return map;
  try {
    const m = JSON.parse(readFileSync(path, 'utf8'));
    const entries = Array.isArray(m) ? m : m.tracks ?? m;
    const items = Array.isArray(entries) ? entries : Object.entries(entries).map(([k, e]) => ({ id: k, ...(e && typeof e === 'object' ? e : {}) }));
    for (const e of items) {
      if (!e || typeof e !== 'object') continue;
      const key = String(e.file || e.name || e.id || '');
      if (key) map.set(basename(key).replace(/\.(mp3|m4a|wav|aac|ogg|flac|opus)$/i, ''), e);
    }
  } catch (e) {
    warn(`could not read music manifest ${path} (${e.message}); classifying by name only.`);
  }
  return map;
}

/**
 * Classify one music track stem. Returns { ai, unknown, why, warning? }.
 * Human-made (ai false) only with a manifest entry aiGenerated: false; everything not
 * positively known is AI (fail-safe).
 */
export function classifyTrack(stem, manifest = new Map()) {
  if (LEGACY_AI_BEDS.includes(stem)) return { ai: true, unknown: false, why: 'legacy vidIQ-generated bed (AI music)' };
  const entry = manifest.get(stem);
  if (entry && typeof entry.aiGenerated === 'boolean') {
    return { ai: entry.aiGenerated, unknown: false, why: `manifest aiGenerated=${entry.aiGenerated}${entry.source ? ` (${entry.source})` : ''}` };
  }
  for (const [p, why] of Object.entries(AI_PREFIXES)) if (stem.startsWith(p)) return { ai: true, unknown: false, why };
  for (const [p, label] of Object.entries(HUMAN_PREFIXES)) {
    if (stem.startsWith(p)) {
      return {
        ai: true, unknown: true, why: `${label} without a manifest aiGenerated flag, treated as AI-generated (fail-safe)`,
        warning: `${p}* track "${stem}" is not in assets/music/manifest.json (or has no aiGenerated flag); add it with aiGenerated:false ` +
          '(scripts/ingest-music.mjs does this). Treated as AI-generated (fail-safe) for now.',
      };
    }
  }
  return {
    ai: true, unknown: true, why: 'unknown track, treated as AI-generated (fail-safe)',
    warning: `unknown music track "${stem}": not a legacy bed, not in the manifest, no known prefix. Treated as AI-generated (fail-safe); add it to assets/music/manifest.json.`,
  };
}

/**
 * Decide status.containsSyntheticMedia for a meta object (contract C3).
 * Returns { value, reasons[], tracks[{name, ai, why}], warnings[], abort|null }.
 */
export function decideSynthetic(meta, { synthetic = false, manifest = new Map() } = {}) {
  const reasons = [];
  const warnings = [];
  const tracks = [];
  if (synthetic) reasons.push('--synthetic flag');
  if (isTrue(meta.containsSyntheticMedia)) reasons.push('meta.containsSyntheticMedia=true');
  if (isTrue(meta.aiFootage)) reasons.push('meta.aiFootage=true');
  const names = musicNames(meta.music);
  if (names === null) {
    reasons.push('meta.music not declared (fail-safe)');
    warnings.push(`meta.music is ${meta.music === undefined || meta.music === null ? 'missing' : `empty (${JSON.stringify(meta.music)})`}: ` +
      'declare the bed file(s) used, or "none". Treated as AI-generated music (fail-safe).');
  } else {
    for (const name of names) {
      if (name.toLowerCase() === 'none') continue;
      const c = classifyTrack(name, manifest);
      tracks.push({ name, ai: c.ai, why: c.why });
      if (c.ai) reasons.push(`music ${name}: ${c.why}`);
      if (c.unknown) warnings.push(c.warning);
    }
  }
  const value = reasons.length > 0;
  let abort = null;
  if (isTrue(meta.aiFootage) && isExplicitFalse(meta.containsSyntheticMedia)) {
    abort = 'meta.aiFootage is true but meta.containsSyntheticMedia is explicitly false. Realistic AI footage must be ' +
      'disclosed as altered or synthetic content. Fix meta.json (set containsSyntheticMedia to true or remove it). Not uploading.';
  } else if (isExplicitFalse(meta.containsSyntheticMedia) && value) {
    warnings.push(`meta.containsSyntheticMedia=false overridden to true: ${reasons.join('; ')}`);
  }
  return { value, reasons, tracks, warnings, abort };
}

const isMain = (() => {
  try { return realpathSync(process.argv[1] || '') === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
})();
if (isMain) await main();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const unknownFlags = Object.keys(args).filter((k) => !KNOWN_FLAGS.includes(k));
  if (unknownFlags.length) warn(`ignoring unknown flag(s): ${unknownFlags.map((k) => `--${k}`).join(' ')} (known: ${KNOWN_FLAGS.map((k) => `--${k}`).join(' ')})`);
  const dryRun = flag(args['dry-run']);
  const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
  if (!dryRun && (!CID || !CSECRET || !RTOKEN)) {
    fail(
      'Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN.\n' +
        'Add them as environment secrets (never in chat/repo). One-time setup:\n' +
        '  1. Google Cloud console -> create project -> enable "YouTube Data API v3".\n' +
        '  2. OAuth consent screen (External) -> add yourself as test user.\n' +
        '  3. Credentials -> OAuth client ID -> Desktop app -> note client id/secret.\n' +
        '  4. On YOUR machine: node scripts/youtube-oauth-helper.mjs (prints refresh token).',
    );
  }
  if (!args.meta || (!args.video && !dryRun)) {
    fail('Usage: node scripts/youtube-upload.mjs --video <mp4> --meta <json> [--thumbnail <img>] [--synthetic] [--dry-run]');
  }

  const meta = JSON.parse(await readFile(args.meta, 'utf8'));
  if (!meta.title) fail('meta.json must include "title"');
  if (meta.title.length > 100) { meta.title = meta.title.slice(0, 97) + '...'; warn('Title >100 chars; truncated.'); }
  if ((meta.description || '').length > 4900) { meta.description = meta.description.slice(0, 4900); warn('Description near 5000-byte cap; truncated.'); }
  const tags = (meta.tags || []).filter((t) => t.length <= 30);
  while (tags.join('').length + tags.length * 2 > 480) tags.pop();

  // AI / synthetic disclosure (C3). Decided before anything touches the network.
  const decision = decideSynthetic(meta, {
    synthetic: flag(args.synthetic),
    manifest: loadMusicManifest(args['music-manifest'] || DEFAULT_MUSIC_MANIFEST),
  });
  for (const w of decision.warnings) warn(w);
  console.log(`containsSyntheticMedia=${decision.value} (${decision.value ? decision.reasons.join('; ') : 'no AI music or AI footage declared'})`);
  if (decision.abort) fail(`ABORT: ${decision.abort}`);

  const status = { privacyStatus: meta.privacyStatus || 'public', selfDeclaredMadeForKids: false, containsSyntheticMedia: decision.value };
  if (meta.publishAt) {
    status.privacyStatus = 'private'; // API requires private + publishAt for scheduling
    status.publishAt = meta.publishAt;
  }
  const body = {
    snippet: {
      title: meta.title,
      description: meta.description || '',
      tags,
      categoryId: meta.categoryId || '27',
      defaultLanguage: meta.defaultLanguage || 'en',
      defaultAudioLanguage: meta.defaultLanguage || 'en',
    },
    status,
  };

  if (dryRun) {
    const size = args.video ? (await stat(args.video)).size : null;
    console.log(JSON.stringify({
      dryRun: true,
      video: args.video || null,
      sizeBytes: size,
      thumbnail: args.thumbnail || null,
      request: { method: 'POST', endpoint: 'upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', body },
      synthetic: { containsSyntheticMedia: decision.value, reasons: decision.reasons, tracks: decision.tracks, warnings: decision.warnings },
    }, null, 2));
    console.log('Dry run: nothing uploaded.');
    return;
  }

  const accessToken = await getAccessToken(CID, CSECRET, RTOKEN);
  const videoBytes = await readFile(args.video);
  const size = (await stat(args.video)).size;
  process.stderr.write(`Uploading ${args.video} (${(size / 1024 / 1024).toFixed(1)} MiB) as "${meta.title}"...\n`);

  // Resumable upload: init session, then PUT the bytes (with retry).
  const init = await withRetry(() =>
    fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(size),
        'X-Upload-Content-Type': 'video/mp4',
      },
      body: JSON.stringify(body),
    }),
  );
  if (!init.ok) fail(`Upload session init failed ${init.status}: ${await init.text()}`);
  const uploadUrl = init.headers.get('location');

  const up = await withRetry(() =>
    fetch(uploadUrl, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'video/mp4', 'Content-Length': String(size) },
      body: videoBytes,
    }),
  );
  if (!up.ok) fail(`Upload failed ${up.status}: ${await up.text()}`);
  const video = await up.json();
  const videoId = video.id;
  console.log(`Uploaded: https://www.youtube.com/watch?v=${videoId}`);
  console.log(`Status: ${video.status?.privacyStatus}${video.status?.publishAt ? ` (publishes ${video.status.publishAt})` : ''}` +
    `${video.status?.uploadStatus ? `, uploadStatus=${video.status.uploadStatus}` : ''}`);
  const echoed = video.status?.containsSyntheticMedia;
  if (echoed === undefined) warn(`The API response did not echo status.containsSyntheticMedia; check the AI disclosure in Studio (expected ${decision.value}).`);
  else if (echoed !== decision.value) warn(`status.containsSyntheticMedia came back ${echoed}, expected ${decision.value}; fix it in Studio.`);

  if (args.thumbnail) {
    const img = await readFile(args.thumbnail);
    const type = args.thumbnail.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const t = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': type, 'Content-Length': String(img.length) },
      body: img,
    });
    if (t.ok) console.log('Custom thumbnail set.');
    else warn(`Thumbnail set failed ${t.status} (channel may need phone verification): ${await t.text()}`);
  }

  console.log(JSON.stringify({
    videoId, url: `https://www.youtube.com/watch?v=${videoId}`, privacyStatus: video.status?.privacyStatus,
    publishAt: video.status?.publishAt || null,
    containsSyntheticMedia: decision.value, // what was requested
    containsSyntheticMediaEchoed: echoed ?? null, // what the API response says (null = not echoed; check Studio)
  }));
}

async function getAccessToken(CID, CSECRET, RTOKEN) {
  const res = await withRetry(() =>
    fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }),
    }),
  );
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    fail(`OAuth token refresh failed ${res.status}: ${JSON.stringify(data)}\n` +
      '(A revoked/expired refresh token must be re-minted with scripts/youtube-oauth-helper.mjs. ' +
      'Note: consent-screen apps left in "Testing" mode get refresh tokens that expire after 7 days — publish the app to make them durable.)');
  }
  return data.access_token;
}

async function withRetry(fn, tries = 4) {
  for (let i = 1; ; i++) {
    const res = await fn().catch((e) => ({ ok: false, status: 0, text: async () => e.message, networkError: true }));
    if (res.ok || (res.status < 500 && res.status !== 0) || i > tries) return res;
    const wait = 2 ** i * 1000;
    warn(`Transient error (${res.status || 'network'}); retry ${i}/${tries} in ${wait / 1000}s`);
    await new Promise((r) => setTimeout(r, wait));
  }
}

/** --key value | --key=value | --flag. */
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const eq = argv[i].indexOf('=');
    if (eq > 2) { o[argv[i].slice(2, eq)] = argv[i].slice(eq + 1); continue; }
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    const takesValue = next !== undefined && !next.startsWith('--') && (!['dry-run', 'synthetic'].includes(key) || /^(true|false|yes|no|on|off|1|0)$/i.test(next));
    o[key] = takesValue ? argv[++i] : 'true';
  }
  return o;
}

function flag(v) { return v !== undefined && !/^(false|0|no|off)$/i.test(String(v)); }
function warn(msg) { process.stderr.write(`WARN: ${msg}\n`); }
function fail(msg) { console.error(msg); process.exit(1); }
