#!/usr/bin/env node
/**
 * youtube-upload.mjs — upload a finished Short to YouTube via the Data API v3.
 *
 * This is the "publish" leg of the 鬼灭 factory. It supports the low-hour-make /
 * peak-hour-publish pattern WITHOUT a second routine: upload the rendered mp4 during
 * a low-traffic hour as privacyStatus=private with --publishAt set to the peak hour;
 * YouTube flips it public automatically at that time. No babysitting, no second job.
 *
 * Prerequisites (owner-granted; fails clearly without them — never paste secrets in chat):
 *   1. A Google Cloud OAuth client with the YouTube Data API enabled, and a refresh
 *      token authorized for the TARGET channel (the upload goes to whatever channel the
 *      refresh token authorizes — i.e. the owner's own authorized channel).
 *   2. Env vars: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN.
 *   3. Network allowlist: oauth2.googleapis.com and www.googleapis.com.
 *
 * Usage:
 *   node scripts/youtube-upload.mjs --video kimetsu/briefs/out/2026-06-06.mp4 \
 *     --title "他怕到睡着了…善逸 #shorts" \
 *     --description "..." --tags "demonslayer,shorts,edit" \
 *     [--privacy private|unlisted|public] [--publishAt 2026-06-06T19:00:00-07:00] \
 *     [--categoryId 24]
 *
 * Safety defaults: privacy=private (you confirm before it goes public). #Shorts is
 * implied by a vertical video < 60s; keep "#shorts" in the title/description to be safe.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';

const args = parseArgs(process.argv.slice(2));
const { YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN } = process.env;

if (!YT_CLIENT_ID || !YT_CLIENT_SECRET || !YT_REFRESH_TOKEN) {
  fail(
    'Missing YouTube OAuth env vars (YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN).\n' +
      'Add them as environment secrets (Variables) — never paste in chat — and allowlist\n' +
      'oauth2.googleapis.com + www.googleapis.com. See kimetsu/SETUP.md §C.',
  );
}
if (!args.video || !args.title) fail('Usage: --video <file.mp4> --title "..." [--description ...] [--tags a,b] [--privacy private] [--publishAt ISO8601]');
if (!existsSync(args.video)) fail(`Video not found: ${args.video}`);

// publishAt (scheduled publish) requires the video to be uploaded as private.
let privacy = args.privacy || 'private';
if (args.publishAt) {
  if (Number.isNaN(Date.parse(args.publishAt))) fail(`--publishAt must be ISO-8601, got: ${args.publishAt}`);
  if (privacy !== 'private') console.warn('⚠ --publishAt requires privacy=private; overriding to private (it auto-publishes at that time).');
  privacy = 'private';
}

// 1) Refresh → access token.
const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: YT_CLIENT_ID,
    client_secret: YT_CLIENT_SECRET,
    refresh_token: YT_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
}).catch((e) => fail(`Network error reaching oauth2.googleapis.com: ${e.message}\nIs it on the allowlist?`));
if (!tokenRes.ok) fail(`Token refresh failed ${tokenRes.status}: ${await tokenRes.text()}`);
const accessToken = (await tokenRes.json()).access_token;
if (!accessToken) fail('No access_token returned from token refresh.');

// 2) Build metadata + initiate a resumable upload session.
const metadata = {
  snippet: {
    title: args.title.slice(0, 100),
    description: args.description || '',
    tags: args.tags ? args.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    categoryId: args.categoryId || '24', // 24 = Entertainment
  },
  status: {
    privacyStatus: privacy,
    selfDeclaredMadeForKids: false,
    ...(args.publishAt ? { publishAt: new Date(args.publishAt).toISOString() } : {}),
  },
};
const bytes = readFileSync(args.video);
const initRes = await fetch(
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/*',
      'X-Upload-Content-Length': String(statSync(args.video).size),
    },
    body: JSON.stringify(metadata),
  },
).catch((e) => fail(`Network error reaching www.googleapis.com: ${e.message}\nIs it on the allowlist?`));
if (!initRes.ok) fail(`Upload init failed ${initRes.status}: ${await initRes.text()}`);
const uploadUrl = initRes.headers.get('location');
if (!uploadUrl) fail('No resumable upload URL returned.');

// 3) Upload the bytes.
console.log(`▶ Uploading ${args.video} (${(bytes.length / 1e6).toFixed(1)} MB)…`);
const putRes = await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'video/*', 'Content-Length': String(bytes.length) },
  body: bytes,
}).catch((e) => fail(`Upload PUT failed: ${e.message}`));
if (!putRes.ok) fail(`Upload failed ${putRes.status}: ${await putRes.text()}`);
const video = await putRes.json();

const id = video.id;
const when = args.publishAt ? `scheduled → public at ${args.publishAt}` : `privacy=${privacy}`;
console.log(`✓ Uploaded: https://youtu.be/${id}  (${when})`);
console.log('  Review in YouTube Studio before it goes public if you set privacy=private without --publishAt.');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i += 1; }
  }
  return out;
}
function fail(msg) { console.error(msg); process.exit(1); }
