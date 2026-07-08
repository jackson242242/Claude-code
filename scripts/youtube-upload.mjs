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
 *
 * meta.json shape (all camelCase):
 *   {
 *     "title": "...",                 // <= 100 chars
 *     "description": "...",           // <= 5000 bytes
 *     "tags": ["a", "b"],            // total <= 500 chars
 *     "categoryId": "27",            // 27 = Education
 *     "privacyStatus": "public",     // public | unlisted | private
 *     "publishAt": "2026-07-09T13:00:00Z",  // optional; forces private until then
 *     "defaultLanguage": "en"
 *   }
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

const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) {
  fail(
    'Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN.\n' +
      'Add them as environment secrets (never in chat/repo). One-time setup:\n' +
      '  1. Google Cloud console -> create project -> enable "YouTube Data API v3".\n' +
      '  2. OAuth consent screen (External) -> add yourself as test user.\n' +
      '  3. Credentials -> OAuth client ID -> Desktop app -> note client id/secret.\n' +
      '  4. On YOUR machine: node scripts/youtube-oauth-helper.mjs (prints refresh token).',
  );
}

const args = parseArgs(process.argv.slice(2));
if (!args.video || !args.meta) fail('Usage: node scripts/youtube-upload.mjs --video <mp4> --meta <json> [--thumbnail <img>]');

const meta = JSON.parse(await readFile(args.meta, 'utf8'));
if (!meta.title) fail('meta.json must include "title"');
if (meta.title.length > 100) { meta.title = meta.title.slice(0, 97) + '...'; warn('Title >100 chars; truncated.'); }
if ((meta.description || '').length > 4900) { meta.description = meta.description.slice(0, 4900); warn('Description near 5000-byte cap; truncated.'); }
const tags = (meta.tags || []).filter((t) => t.length <= 30);
while (tags.join('').length + tags.length * 2 > 480) tags.pop();

const status = { privacyStatus: meta.privacyStatus || 'public', selfDeclaredMadeForKids: false };
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

const accessToken = await getAccessToken();
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

console.log(JSON.stringify({ videoId, url: `https://www.youtube.com/watch?v=${videoId}`, privacyStatus: video.status?.privacyStatus, publishAt: video.status?.publishAt || null }));

async function getAccessToken() {
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

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  }
  return o;
}

function warn(msg) { process.stderr.write(`WARN: ${msg}\n`); }
function fail(msg) { console.error(msg); process.exit(1); }
