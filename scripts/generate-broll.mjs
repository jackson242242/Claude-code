#!/usr/bin/env node
/**
 * generate-broll.mjs — generate ORIGINAL vertical b-roll stills via the OpenAI Images
 * API (gpt-image-1), so the mashup can be cut from copyright-safe imagery instead of
 * ripped 鬼灭 footage. Stills are fed to the render engine and animated with Ken Burns
 * (manifest clip { src: "...png", motion: "in" }).
 *
 * ⚠ COPYRIGHT-SAFE ONLY WORKS IF THE IMAGERY IS ORIGINAL. "AI 原创" does NOT mean
 * "redraw Tanjiro". Reproducing a protected character design / name / logo is still
 * infringement. Prompts MUST be atmospheric / symbolic / generic — a lone swordsman
 * silhouette in falling snow, a wisteria forest at dusk, a single ember over dark water,
 * dawn over mountains — NO named 鬼灭 characters, NO logos, NO official marks.
 * The script enforces a guardrail substring check and refuses obvious character names.
 *
 * Prerequisites (owner-granted; fails clearly without them):
 *   1. OPENAI_API_KEY in the environment (a secret — never pasted in chat).
 *   2. Host `api.openai.com` on the environment network allowlist.
 *
 * Usage (single):
 *   node scripts/generate-broll.mjs --prompt "lone swordsman silhouette, falling snow, moody dawn, painterly" \
 *     --out kimetsu/assets/2026-06-06/s1.png [--size 1024x1536] [--quality medium]
 * Usage (batch): a JSON array of { name, prompt }:
 *   node scripts/generate-broll.mjs --prompts kimetsu/briefs/broll-2026-06-06.json \
 *     --outdir kimetsu/assets/2026-06-06
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  fail(
    'Missing OPENAI_API_KEY.\nAdd it as an environment secret (Variables) in your Claude Code ' +
      'environment settings — do NOT paste the key into chat. Also allowlist api.openai.com. Then re-run.',
  );
}

// Guardrail: refuse prompts that name protected 鬼灭 characters / marks (PLAYBOOK §2).
const BANNED = ['tanjiro', 'nezuko', 'zenitsu', 'inosuke', 'rengoku', 'giyu', 'demon slayer', 'kimetsu', '鬼灭', '炭治郎', '祢豆子', '善逸', '猪之助', '炎柱'];
const checkPrompt = (p) => {
  const low = p.toLowerCase();
  const hit = BANNED.find((b) => low.includes(b));
  if (hit) {
    fail(
      `Prompt rejected: contains "${hit}". Generate ORIGINAL atmospheric/symbolic imagery, not a ` +
        'protected character/mark (PLAYBOOK §2). Reframe to a generic mood (e.g. "lone swordsman silhouette in snow").',
    );
  }
};

const size = args.size || '1024x1536'; // portrait, matches 9:16-ish for Ken Burns crop
const quality = args.quality || 'medium';

let jobs;
if (args.prompts) {
  const list = JSON.parse(readFileSync(args.prompts, 'utf8'));
  if (!Array.isArray(list)) fail('--prompts file must be a JSON array of { name, prompt }.');
  const outdir = args.outdir || dirname(args.prompts);
  jobs = list.map((it) => ({ prompt: it.prompt, out: join(outdir, `${it.name}.png`) }));
} else if (args.prompt && args.out) {
  jobs = [{ prompt: args.prompt, out: args.out }];
} else {
  fail('Usage: --prompt "..." --out file.png  OR  --prompts list.json [--outdir dir]');
}

for (const job of jobs) {
  checkPrompt(job.prompt);
}

for (const job of jobs) {
  // Steer toward original, painterly, non-character imagery; keep it cinematic.
  const styled = `${job.prompt}. Original atmospheric anime-inspired illustration, painterly, cinematic lighting, vertical composition, no text, no logos, no real or recognizable copyrighted characters.`;
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt: styled, n: 1, size, quality, output_format: 'png' }),
  }).catch((err) =>
    fail(`Network error reaching api.openai.com: ${err.message}\nIs api.openai.com on the network allowlist?`),
  );
  if (!res.ok) fail(`OpenAI Images API error ${res.status}: ${await res.text()}`);
  const b64 = (await res.json())?.data?.[0]?.b64_json;
  if (!b64) fail('No image data returned from the API.');
  await mkdir(dirname(job.out), { recursive: true });
  await writeFile(job.out, Buffer.from(b64, 'base64'));
  console.log(`✓ ${job.out} (${size}, ${quality})`);
}
console.log(`Done: ${jobs.length} still(s). Reference them in the manifest as image clips with a "motion".`);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i += 1; }
  }
  return out;
}
function fail(msg) { console.error(msg); process.exit(1); }
