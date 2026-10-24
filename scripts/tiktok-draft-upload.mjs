#!/usr/bin/env node
/**
 * Push a video into the owner's TikTok inbox as a DRAFT (Content Posting API,
 * inbox mode — no publish; the owner opens TikTok, adds trending sound + caption,
 * taps post). Works for unaudited apps: inbox/draft is the unaudited-safe mode.
 *
 * Usage: NODE_USE_ENV_PROXY=1 node scripts/tiktok-draft-upload.mjs --video path.mp4
 * Env: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REFRESH_TOKEN
 *
 * First-run note (2026-08-12): endpoints follow the v2 API spec current as of
 * early 2026; developers.tiktok.com is proxy-blocked from this sandbox, so the
 * first real run is the live validation — report errors verbatim, do not guess.
 */
import { readFile, stat } from 'node:fs/promises';

const { TIKTOK_CLIENT_KEY: KEY, TIKTOK_CLIENT_SECRET: SECRET, TIKTOK_REFRESH_TOKEN: RTOKEN } = process.env;
if (!KEY || !SECRET || !RTOKEN) fail('Missing TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET / TIKTOK_REFRESH_TOKEN env secrets.');
const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[i + 1];
if (!args.video) fail('Usage: node scripts/tiktok-draft-upload.mjs --video final-clean.mp4');

// 1. refresh access token
const tok = await (await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_key: KEY, client_secret: SECRET, grant_type: 'refresh_token', refresh_token: RTOKEN }),
})).json();
if (!tok.access_token) fail('Token refresh failed: ' + JSON.stringify(tok));

// 2. init inbox upload (single chunk — our masters are <64MB)
const size = (await stat(args.video)).size;
if (size > 64 * 1024 * 1024) fail('Video >64MB — recompress first (crf 24) or add chunking.');
const init = await (await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
  method: 'POST', headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: size, total_chunk_count: 1 } }),
})).json();
if (!init.data?.upload_url) fail('Init failed: ' + JSON.stringify(init));

// 3. upload the file
const put = await fetch(init.data.upload_url, {
  method: 'PUT',
  headers: { 'Content-Type': 'video/mp4', 'Content-Range': `bytes 0-${size - 1}/${size}` },
  body: await readFile(args.video),
});
if (!put.ok) fail(`Upload PUT failed: ${put.status} ${await put.text()}`);

// 4. poll status until done
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  const st = await (await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
    method: 'POST', headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ publish_id: init.data.publish_id }),
  })).json();
  const s = st.data?.status;
  if (s === 'SEND_TO_USER_INBOX' || s === 'PUBLISH_COMPLETE') {
    console.log(JSON.stringify({ ok: true, publish_id: init.data.publish_id, status: s }));
    process.exit(0);
  }
  if (s === 'FAILED') fail('TikTok processing failed: ' + JSON.stringify(st.data));
}
fail('Timed out waiting for inbox delivery (check the TikTok app inbox anyway).');

function fail(m) { console.error(m); process.exit(1); }
