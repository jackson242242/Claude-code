#!/usr/bin/env node
/**
 * One-time helper to mint a YouTube refresh token for the automation.
 * RUN THIS ON YOUR OWN MACHINE (it needs a browser) — not in the cloud session.
 *
 * Steps it automates: prints the owner checklist, prints the Google consent URL, catches
 * the redirect on http://localhost:8899, exchanges the code, and prints the refresh token
 * (once, to your own terminal) that you then save as the YOUTUBE_REFRESH_TOKEN secret.
 * It also prints the equivalent OAuth Playground steps (the route used for the last token).
 *
 * Usage:
 *   YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... node scripts/youtube-oauth-helper.mjs \
 *     [--scopes youtube,youtube.upload,youtube.force-ssl,yt-analytics.readonly] [--print-only]
 *
 *   --scopes      comma list; short names expand to https://www.googleapis.com/auth/<name>
 *                 (full URLs pass through). Default, unchanged: youtube.upload + youtube.
 *                 Recommended 2026-10-17: youtube,youtube.upload,youtube.force-ssl,
 *                 yt-analytics.readonly (force-ssl = post/reply to comments;
 *                 yt-analytics.readonly = watch time, traffic sources, subscribers per video).
 *                 Add drive.readonly only for owner-footage intake path A (it can read your
 *                 whole Google Drive).
 *   --print-only  print the checklist, the consent URL and the Playground steps, then exit
 *                 without starting the local server.
 *
 * The OAuth client must be a "Desktop app" (or "Web" with redirect URI
 * http://localhost:8899 added). For the OAuth Playground route the client must be a
 * "Web application" with https://developers.google.com/oauthplayground as a redirect URI.
 */
import { createServer } from 'node:http';

const args = parseArgs(process.argv.slice(2));
const CID = process.env.YOUTUBE_CLIENT_ID;
const CSECRET = process.env.YOUTUBE_CLIENT_SECRET;
if (!CID || !CSECRET) {
  console.error('Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET env vars first.');
  process.exit(1);
}

// Nothing project-specific is committed: the project number is the first part of the client id
// (<number>-<hash>.apps.googleusercontent.com), read at run time.
const projectNumber = (/^(\d+)-/.exec(CID) || [])[1];
const GCP_PROJECT = projectNumber ? `project number ${projectNumber}, from YOUTUBE_CLIENT_ID` : 'the project that owns YOUTUBE_CLIENT_ID';
const REDIRECT = 'http://localhost:8899';
const DEFAULT_SCOPES = ['youtube.upload', 'youtube'];
const scopeList = [...new Set((args.scopes && args.scopes !== 'true' ? args.scopes.split(',') : DEFAULT_SCOPES)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => (s.startsWith('https://') ? s : `https://www.googleapis.com/auth/${s}`)))];
const SCOPE = scopeList.join(' ');
const short = (s) => s.replace('https://www.googleapis.com/auth/', '');
const wants = (name) => scopeList.some((s) => short(s) === name);

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: CID,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  });

const apis = ['YouTube Data API v3 (already on)'];
if (wants('yt-analytics.readonly') || wants('yt-analytics-monetary.readonly')) apis.push('YouTube Analytics API');
if (scopeList.some((s) => short(s).startsWith('drive'))) apis.push('Google Drive API');

console.log(`
OWNER CHECKLIST — do these in Google Cloud BEFORE minting the token (${GCP_PROJECT})
  1. APIs & Services > Library: enable ${apis.join(', ')}.
  2. Google Auth Platform (OAuth consent screen) > Audience: "Publishing status" must be
     "In production". In "Testing" the refresh token EXPIRES AFTER 7 DAYS and the daily
     upload breaks. (An unverified app in production still works for your own account;
     Google may show an "unverified app" warning: Advanced > Go to <app name>.)
  3. Google Auth Platform > Data access > Add or remove scopes: add every scope below.
  4. After minting: replace YOUTUBE_REFRESH_TOKEN in the routine's environment variables
     with the new token. Never paste it into chat, a file or a commit.

Scopes requested:
${scopeList.map((s) => `  - ${s}`).join('\n')}

OPTION A — this helper (Desktop-app client, redirect ${REDIRECT}):
  Open this URL in your browser and approve access with the Google account that owns the
  CHINATRAVEL channel (pick the channel if Google asks which account/brand account):

${authUrl}

OPTION B — OAuth Playground (what you used for the last token):
  1. Open https://developers.google.com/oauthplayground
  2. Gear icon (OAuth 2.0 configuration): tick "Use your own OAuth credentials" and paste the
     client ID and client secret (with the Playground's own credentials Google revokes the
     token after 24 hours and it will not work with our client). Access type: Offline.
     Force prompt: Consent Screen.
  3. Step 1, box "Input your own scopes": paste this line, then "Authorize APIs":
     ${SCOPE}
  4. Sign in with the account that owns the channel, choose the channel, allow every scope.
  5. Step 2: "Exchange authorization code for tokens"; copy the "Refresh token".
  (The client must list https://developers.google.com/oauthplayground as a redirect URI.)
`);

if (args['print-only'] === 'true') process.exit(0);

console.log(`Waiting for the redirect on ${REDIRECT} ... (Ctrl+C if you use the Playground instead)\n`);

const server = createServer(async (req, res) => {
  const code = new URL(req.url, REDIRECT).searchParams.get('code');
  if (!code) { res.end('No code in request.'); return; }
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: CID, client_secret: CSECRET, redirect_uri: REDIRECT, grant_type: 'authorization_code' }),
  });
  const data = await tokenRes.json();
  if (data.refresh_token) {
    res.end('Success — refresh token printed in your terminal. You can close this tab.');
    console.log('\nYOUTUBE_REFRESH_TOKEN=' + data.refresh_token);
    const granted = (data.scope || '').split(' ').filter(Boolean);
    const missing = scopeList.filter((s) => !granted.includes(s));
    console.log(`\nGranted scopes: ${granted.map(short).join(', ') || '(not reported)'}`);
    if (granted.length && missing.length) console.log(`WARNING: not granted: ${missing.map(short).join(', ')} — tick every box on the consent screen and run again.`);
    console.log('\nSave it as an environment secret in the Claude Code environment (Variables). Never commit it.');
    console.log('Reminder: if the OAuth consent screen is still in "Testing" mode this token expires in 7 days — publish the app for a durable token.');
  } else {
    res.end('Token exchange failed — see terminal.');
    console.error('Token exchange failed:', data.error || '', data.error_description || '');
  }
  server.close();
});
server.listen(8899);

/** --key value | --key=value | --flag. */
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const eq = argv[i].indexOf('=');
    if (eq > 2) { o[argv[i].slice(2, eq)] = argv[i].slice(eq + 1); continue; }
    o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  }
  return o;
}
