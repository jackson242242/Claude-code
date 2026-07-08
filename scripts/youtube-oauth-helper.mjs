#!/usr/bin/env node
/**
 * One-time helper to mint a YouTube refresh token for the automation.
 * RUN THIS ON YOUR OWN MACHINE (it needs a browser) — not in the cloud session.
 *
 * Steps it automates: prints the Google consent URL, catches the redirect on
 * http://localhost:8899, exchanges the code, and prints the refresh token that
 * you then save as the YOUTUBE_REFRESH_TOKEN environment secret.
 *
 * Usage:
 *   YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... node scripts/youtube-oauth-helper.mjs
 *
 * The OAuth client must be a "Desktop app" (or "Web" with redirect URI
 * http://localhost:8899 added). Scope requested: youtube.upload + youtube
 * (upload, set thumbnails, manage own videos).
 */
import { createServer } from 'node:http';

const CID = process.env.YOUTUBE_CLIENT_ID;
const CSECRET = process.env.YOUTUBE_CLIENT_SECRET;
if (!CID || !CSECRET) {
  console.error('Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET env vars first.');
  process.exit(1);
}

const REDIRECT = 'http://localhost:8899';
const SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
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

console.log('\n1. Open this URL in your browser and approve access with the Google account that owns @NYneighborhood:\n');
console.log(authUrl + '\n');
console.log('2. Waiting for the redirect on http://localhost:8899 ...\n');

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
    console.log('\nSave it as an environment secret in the Claude Code environment (Variables). Never commit it.');
    console.log('Reminder: if the OAuth consent screen is still in "Testing" mode this token expires in 7 days — publish the app for a durable token.');
  } else {
    res.end('Token exchange failed — see terminal.');
    console.error('Token exchange failed:', data);
  }
  server.close();
});
server.listen(8899);
