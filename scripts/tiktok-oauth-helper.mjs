#!/usr/bin/env node
/**
 * One-time TikTok OAuth helper for the draft-inbox uploader.
 *
 * Step 1 (print the authorize URL):
 *   node scripts/tiktok-oauth-helper.mjs --client-key KEY --redirect https://example.com/cb
 *   -> open the URL in a browser, log in as @chinatravelexpertz, approve.
 *   The browser lands on your redirect URI (page may 404 — that's fine);
 *   copy the `code` query param from the address bar.
 *
 * Step 2 (exchange the code for tokens):
 *   node scripts/tiktok-oauth-helper.mjs --client-key KEY --client-secret SECRET \
 *     --redirect https://example.com/cb --code THE_CODE
 *   -> prints access_token (24h) + refresh_token (~365d).
 *   Store TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET / TIKTOK_REFRESH_TOKEN as
 *   environment secrets (never in chat or the repo).
 */
const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[i + 1];
if (!args['client-key']) { console.error('need --client-key'); process.exit(1); }

if (!args.code) {
  const u = new URL('https://www.tiktok.com/v2/auth/authorize/');
  u.searchParams.set('client_key', args['client-key']);
  u.searchParams.set('scope', 'user.info.basic,video.upload');
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('redirect_uri', args.redirect);
  u.searchParams.set('state', 'cte' + Math.floor(Date.now() / 1000));
  console.log('Open this URL in a browser and approve:\n\n' + u.toString());
  process.exit(0);
}

const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_key: args['client-key'], client_secret: args['client-secret'],
    code: args.code, grant_type: 'authorization_code', redirect_uri: args.redirect,
  }),
});
const body = await res.json();
if (!body.access_token) { console.error('Exchange failed:', JSON.stringify(body, null, 2)); process.exit(1); }
console.log(JSON.stringify({ open_id: body.open_id, expires_in: body.expires_in,
  refresh_expires_in: body.refresh_expires_in,
  access_token: body.access_token, refresh_token: body.refresh_token }, null, 2));
console.log('\nStore refresh_token as TIKTOK_REFRESH_TOKEN env secret.');
