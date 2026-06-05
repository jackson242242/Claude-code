#!/usr/bin/env node
/**
 * Generate a design image via the OpenAI Images API (gpt-image-1) and save it
 * into the repo, so an agent can produce real artwork — not just CSS.
 *
 * Prerequisites (owner-granted; the script fails clearly without them):
 *   1. OPENAI_API_KEY present in the environment (add as a secret — never in chat).
 *   2. Host `api.openai.com` on the environment's network allowlist.
 *
 * Usage:
 *   node scripts/generate-asset.mjs \
 *     --prompt "dark cinematic stadium at night, teal pitch glow, warm stand lights, no logos" \
 *     --out public/images/hero-bg.webp \
 *     [--size 1536x1024] [--quality medium]
 *
 * Output format is inferred from the --out extension (webp | png | jpeg).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  fail(
    'Missing OPENAI_API_KEY.\n' +
      'Add it as an environment secret in your Claude Code environment settings ' +
      '(Variables) — do NOT paste the key into chat. Then re-run.',
  );
}
if (!args.prompt || !args.out) {
  fail(
    'Usage: node scripts/generate-asset.mjs --prompt "..." --out public/images/file.webp ' +
      '[--size 1536x1024] [--quality medium]',
  );
}

const ext = args.out.split('.').pop().toLowerCase();
const outputFormat = ext === 'jpg' ? 'jpeg' : ['png', 'jpeg', 'webp'].includes(ext) ? ext : 'webp';

const body = {
  model: 'gpt-image-1',
  prompt: args.prompt,
  n: 1,
  size: args.size || '1536x1024',
  quality: args.quality || 'medium',
  output_format: outputFormat,
};

const response = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}).catch((err) => {
  fail(
    `Network error reaching api.openai.com: ${err.message}\n` +
      'Is api.openai.com on the environment network allowlist (Network access → Custom, or Full)?',
  );
});

if (!response.ok) {
  fail(`OpenAI Images API error ${response.status}: ${await response.text()}`);
}

const payload = await response.json();
const b64 = payload?.data?.[0]?.b64_json;
if (!b64) fail('No image data returned from the API.');

await mkdir(dirname(args.out), { recursive: true });
await writeFile(args.out, Buffer.from(b64, 'base64'));
console.log(`✓ Saved ${args.out} (${outputFormat}, ${body.size}, quality=${body.quality}).`);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      out[token.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
