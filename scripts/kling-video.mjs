#!/usr/bin/env node
/**
 * Generate a short AI video clip via the official Kling AI API (text-to-video).
 * Optional "hero shot" lane — the default pipeline uses Pexels + ffmpeg instead.
 *
 * Prerequisites (owner-granted; the script fails clearly without them):
 *   1. KLING_ACCESS_KEY + KLING_SECRET_KEY env secrets (klingai.com developer console).
 *   2. Host `api-singapore.klingai.com` on the network allowlist.
 *   3. A prepaid resource package on the Kling account (generations are paid;
 *      ~$0.32 per 10s at 1080p as of mid-2026).
 *
 * Usage:
 *   node scripts/kling-video.mjs \
 *     --prompt "slow cinematic pan over a university campus at golden hour, no text" \
 *     --out runs/x/hero.mp4 [--duration 5|10] [--aspect 16:9|9:16|1:1] \
 *     [--model kling-v2-1] [--mode std|pro]
 *
 * Auth is a short-lived HS256 JWT signed from the access/secret key pair.
 * Note: model names evolve (v1-6 / v2-1 / 3.0 tiers) — if the API rejects the
 * default model, list current names in the Kling docs and pass --model.
 */
import { createHmac } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const AK = process.env.KLING_ACCESS_KEY;
const SK = process.env.KLING_SECRET_KEY;
if (!AK || !SK) {
  fail(
    'Missing KLING_ACCESS_KEY / KLING_SECRET_KEY.\n' +
      'Add them as environment secrets (never in chat). Get them from the Kling AI ' +
      'developer console (klingai.com -> API access keys) and prepay a resource package.',
  );
}

const args = parseArgs(process.argv.slice(2));
if (!args.prompt || !args.out) {
  fail('Usage: node scripts/kling-video.mjs --prompt "..." --out <mp4> [--duration 5|10] [--aspect 16:9|9:16] [--model <id>] [--mode std|pro]');
}
const BASE = 'https://api-singapore.klingai.com';

const create = await api('POST', '/v1/videos/text2video', {
  model_name: args.model || 'kling-v2-1',
  prompt: args.prompt,
  duration: String(args.duration || '5'),
  aspect_ratio: args.aspect || '16:9',
  mode: args.mode || 'std',
});
const taskId = create?.data?.task_id;
if (!taskId) fail(`No task_id in create response: ${JSON.stringify(create)}`);
process.stderr.write(`Kling task ${taskId} submitted; polling (video generation takes minutes)...\n`);

const deadline = Date.now() + 15 * 60 * 1000;
let task;
for (;;) {
  await new Promise((r) => setTimeout(r, 15000));
  task = (await api('GET', `/v1/videos/text2video/${taskId}`))?.data;
  const status = task?.task_status;
  process.stderr.write(`  status: ${status}\n`);
  if (status === 'succeed') break;
  if (status === 'failed') fail(`Kling generation failed: ${task?.task_status_msg || JSON.stringify(task)}`);
  if (Date.now() > deadline) fail(`Timed out after 15 min (task ${taskId} still ${status}). Re-poll later via the console.`);
}

const url = task?.task_result?.videos?.[0]?.url;
if (!url) fail(`Task succeeded but no video URL found: ${JSON.stringify(task)}`);
const res = await fetch(url);
if (!res.ok) fail(`Video download failed: HTTP ${res.status}`);
await mkdir(dirname(args.out), { recursive: true });
await writeFile(args.out, Buffer.from(await res.arrayBuffer()));
console.log(`Wrote ${args.out} (task ${taskId}, ${task.task_result.videos[0].duration || '?'}s)`);

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.code !== undefined && data.code !== 0)) {
    fail(`Kling API ${method} ${path} -> HTTP ${res.status}, code ${data.code}: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ iss: AK, exp: now + 1800, nbf: now - 5 })}`;
  return `${unsigned}.${createHmac('sha256', SK).update(unsigned).digest('base64url')}`;
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  }
  return o;
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
