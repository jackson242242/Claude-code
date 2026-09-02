#!/usr/bin/env node
/**
 * Post (and optionally pin) a first comment on our own video — seeds the
 * either-or question / expert tip so the comment section is never empty.
 * Requires the youtube.force-ssl scope (granted 2026-08-24 re-auth).
 * Usage: NODE_USE_ENV_PROXY=1 node scripts/youtube-comment.mjs --video <id> --text "..." [--pin]
 */
const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) { console.error('missing YOUTUBE_* env'); process.exit(1); }
const args = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
if (!args.video || !args.text) { console.error('usage: --video <id> --text "..." [--pin]'); process.exit(1); }
const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }) })).json();
if (!tok.access_token) { console.error('token refresh failed', tok); process.exit(1); }
const H = { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' };
const r = await fetch('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', { method: 'POST', headers: H,
  body: JSON.stringify({ snippet: { videoId: args.video, topLevelComment: { snippet: { textOriginal: String(args.text) } } } }) });
const body = await r.json();
if (!r.ok) { console.error('comment failed:', JSON.stringify(body.error || body).slice(0, 300)); process.exit(1); }
const cid = body.snippet?.topLevelComment?.id || body.id;
console.log(JSON.stringify({ ok: true, commentId: cid, pinned: false, note: args.pin ? 'pinning has no public API — pin manually in Studio if needed; the comment is live as the first comment' : undefined }));
