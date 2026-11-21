#!/usr/bin/env node
/**
 * Owner-run wizard: fills .env.youtube.local for the local YouTube pipeline.
 * Run it yourself in a terminal on your own PC, from the repo root:
 *   node scripts/setup-local-env.mjs
 *
 * Input is hidden and values are never printed. Each value is saved as soon as
 * it is entered, so you can stop and re-run: filled values are skipped.
 * The YouTube refresh token is minted through Google's consent page and written
 * straight to the file. The file is git-ignored; the repo is public.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const FILE = '.env.youtube.local';
const REDIRECT = 'http://localhost:8899';
const SCOPES = ['youtube', 'youtube.upload', 'youtube.force-ssl', 'yt-analytics.readonly']
  .map((s) => `https://www.googleapis.com/auth/${s}`);

const STEPS = [
  { key: 'YOUTUBE_CLIENT_ID', url: 'https://console.cloud.google.com/apis/credentials', help: 'Google Cloud > Credentials > your OAuth client > Client ID' },
  { key: 'YOUTUBE_CLIENT_SECRET', help: 'Same OAuth client > Client secret. A new secret is fine; the old one keeps working until you delete it.' },
  { key: 'PEXELS_API_KEY', url: 'https://www.pexels.com/api/', help: 'Pexels > Your API key' },
  { key: 'OPENAI_API_KEY', url: 'https://platform.openai.com/api-keys', help: 'OpenAI > Create new secret key' },
  { key: 'ELEVENLABS_API_KEY', url: 'https://elevenlabs.io/app/settings/api-keys', help: 'ElevenLabs > API keys > Create' },
  { key: 'ELEVENLABS_VOICE_ID', optional: true, help: 'Optional. Press Enter to skip; the pipeline defaults to Rachel.' },
  { key: 'PIXABAY_API_KEY', optional: true, help: 'Optional. Press Enter to skip.' },
];

function load() {
  if (!existsSync(FILE)) return [];
  return readFileSync(FILE, 'utf8').split(/\r?\n/);
}
function get(key) {
  const line = load().find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : '';
}
function save(key, value) {
  const lines = load();
  const i = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (i >= 0) lines[i] = `${key}=${value}`;
  else lines.push(`${key}=${value}`);
  writeFileSync(FILE, lines.join('\n'));
}
function open(url) {
  spawn('cmd', ['/c', 'start', '', url.replace(/&/g, '^&')], { stdio: 'ignore', detached: true }).unref();
}

/** Reads one line from the terminal without echoing it. */
function askHidden(label) {
  return new Promise((resolve) => {
    process.stdout.write(`${label}: `);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buf = '';
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.off('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          resolve(buf.trim());
          return;
        }
        if (ch === '\u0003') { process.stdout.write('\n'); process.exit(130); }
        if (ch === '\u007f' || ch === '\b') { buf = buf.slice(0, -1); continue; }
        buf += ch;
      }
    };
    stdin.on('data', onData);
  });
}

function mintRefreshToken(cid, csecret) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, REDIRECT);
      const code = url.searchParams.get('code');
      if (!code) { res.end('Waiting for Google.'); return; }
      const r = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: cid, client_secret: csecret, redirect_uri: REDIRECT, grant_type: 'authorization_code' }),
      });
      const data = await r.json();
      res.end(data.refresh_token ? 'Done. You can close this tab.' : 'Failed. See the terminal.');
      server.close();
      resolve(data);
    });
    server.listen(8899, () => {
      const auth = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: cid, redirect_uri: REDIRECT, response_type: 'code',
        scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent',
      });
      console.log('\nYouTube token: a Google page is opening. Choose the account that owns China Travel Expert and allow every permission.');
      console.log('If you see an "unverified app" warning: Advanced > Go to the app.');
      open(auth);
    });
  });
}

if (!process.stdin.isTTY) { console.error('Run this in a real terminal.'); process.exit(1); }
if (!existsSync(FILE)) writeFileSync(FILE, '');

for (const s of STEPS) {
  if (get(s.key)) { console.log(`ok    ${s.key} already filled`); continue; }
  console.log(`\n${s.key}\n  ${s.help}`);
  if (s.url) open(s.url);
  const v = await askHidden(s.optional ? 'Paste value, or Enter to skip (hidden)' : 'Paste value (hidden)');
  if (v) { save(s.key, v); console.log(`saved ${s.key}`); }
  else console.log(`skipped ${s.key}`);
}

const cid = get('YOUTUBE_CLIENT_ID');
const csecret = get('YOUTUBE_CLIENT_SECRET');
if (get('YOUTUBE_REFRESH_TOKEN')) {
  console.log('ok    YOUTUBE_REFRESH_TOKEN already filled');
} else if (cid && csecret) {
  const data = await mintRefreshToken(cid, csecret);
  if (data.refresh_token) {
    save('YOUTUBE_REFRESH_TOKEN', data.refresh_token);
    const granted = (data.scope || '').split(' ').filter(Boolean);
    const missing = SCOPES.filter((x) => !granted.includes(x));
    console.log('saved YOUTUBE_REFRESH_TOKEN');
    console.log(missing.length ? `WARNING: permissions not granted: ${missing.map((m) => m.split('/').pop()).join(', ')}` : 'All permissions granted.');
  } else {
    console.error(`Token step failed: ${data.error || 'unknown error'}. Re-run this script to try again.`);
  }
} else {
  console.log('Skipped the YouTube token: client ID and secret are needed first.');
}

const left = [...STEPS.filter((s) => !s.optional).map((s) => s.key), 'YOUTUBE_REFRESH_TOKEN'].filter((k) => !get(k));
console.log(left.length ? `\nStill empty: ${left.join(', ')}` : '\nAll required values are saved. Tell Claude it is done.');
process.exit(0);
